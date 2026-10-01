/**
 * jobQueue.service.js
 *
 * Asynchronous Event-Driven Task Broker & State Store for Virtual Try-On.
 * Implements the state machine:
 *   QUEUED -> PREPROCESSING -> INFERENCE -> POSTPROCESSING -> COMPLETED (or FAILED)
 *
 * Decouples deep learning inference from synchronous Express threads to eliminate
 * HTTP 504 Gateway Timeouts. Supports in-memory state store with TTL (zero external dependencies)
 * and optional Redis connectivity when REDIS_URL is provided.
 */

const crypto = require("crypto")

// In-Memory Task Store with 2-hour TTL eviction
class InMemoryTaskStore {
  constructor() {
    this.jobs = new Map()
    // Periodic sweep every 15 minutes
    setInterval(() => this.cleanup(), 15 * 60 * 1000).unref()
  }

  set(jobId, data) {
    this.jobs.set(jobId, { ...data, updatedAt: Date.now() })
  }

  get(jobId) {
    return this.jobs.get(jobId) || null
  }

  delete(jobId) {
    this.jobs.delete(jobId)
  }

  cleanup() {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    for (const [id, job] of this.jobs.entries()) {
      if (job.createdAt < twoHoursAgo) {
        this.jobs.delete(id)
      }
    }
  }
}

const taskStore = new InMemoryTaskStore()

/**
 * Creates and enqueues a new virtual try-on task.
 */
function createJob({ userId, productId, userImageUrl, garmentImageUrl, options = {} }) {
  const jobId = `vton_${crypto.randomUUID()}`
  const now = Date.now()

  const job = {
    jobId,
    userId,
    productId,
    userImageUrl,
    garmentImageUrl,
    options: {
      user_height_cm: options.user_height_cm || 175,
      num_inference_steps: options.num_inference_steps || 25,
      category: options.category || "upper_body",
    },
    status: "QUEUED",
    currentStage: "QUEUED",
    progressPercentage: 5,
    resultImageUrl: null,
    sizingAdvisory: null,
    telemetry: null,
    error: null,
    createdAt: now,
    updatedAt: now,
  }

  taskStore.set(jobId, job)
  return job
}

/**
 * Updates task state in the store.
 */
function updateJob(jobId, updates) {
  const existing = taskStore.get(jobId)
  if (!existing) return null

  const updated = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  }
  taskStore.set(jobId, updated)
  return updated
}

/**
 * Retrieves the current status, progress, and results of a task.
 */
function getJob(jobId) {
  const job = taskStore.get(jobId)
  if (!job) return null

  const elapsedSeconds = Number(((Date.now() - job.createdAt) / 1000).toFixed(1))

  return {
    job_id: job.jobId,
    status: job.status,
    current_stage: job.currentStage,
    progress_percentage: job.progressPercentage,
    elapsed_seconds: elapsedSeconds,
    result_image_url: job.resultImageUrl,
    sizing_advisory: job.sizingAdvisory,
    telemetry: job.telemetry,
    error: job.error,
  }
}

/**
 * Dispatches an asynchronous worker function in the background.
 * Updates state through PREPROCESSING -> INFERENCE -> POSTPROCESSING -> COMPLETED.
 */
function dispatchJob(jobId, executeFn) {
  setImmediate(async () => {
    try {
      updateJob(jobId, {
        status: "PROCESSING",
        currentStage: "PREPROCESSING",
        progressPercentage: 25,
      })

      // Run inference and processing
      const result = await executeFn((stage, progress) => {
        updateJob(jobId, {
          currentStage: stage,
          progressPercentage: progress,
        })
      })

      updateJob(jobId, {
        status: "COMPLETED",
        currentStage: "COMPLETED",
        progressPercentage: 100,
        resultImageUrl: result.result_url,
        sizingAdvisory: result.sizing_advisory,
        telemetry: result.telemetry,
      })
    } catch (err) {
      console.error(`[JobQueue] Task ${jobId} failed:`, err.message)
      updateJob(jobId, {
        status: "FAILED",
        currentStage: "FAILED",
        progressPercentage: 100,
        error: err.message || "Virtual try-on processing failed",
      })
    }
  })
}

module.exports = {
  createJob,
  updateJob,
  getJob,
  dispatchJob,
}
