import express from "express"
import cors from "cors"
import ffmpeg from "fluent-ffmpeg"
import fs from "fs"
import path from "path"
import { v4 as uuid } from "uuid"

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 8080
const RENDER_DIR = "./renders"

if (!fs.existsSync(RENDER_DIR)) {
  fs.mkdirSync(RENDER_DIR)
}

/* --------------------------------------------------
   IN-MEMORY JOB STORE
-------------------------------------------------- */

const renderJobs = new Map()

/* --------------------------------------------------
   START RENDER
-------------------------------------------------- */

app.post("/render-movie", async (req, res) => {
  const { timeline } = req.body

  const jobId = uuid()

  renderJobs.set(jobId, {
    jobId,
    status: "queued",
    percent: 0,
    stage: "queued",
  })

  const outputPath = path.join(RENDER_DIR, `${jobId}.mp4`)

  renderTimelineToVideo(timeline, outputPath, jobId)

  res.json({
    jobId,
    stream: `http://localhost:${PORT}/render-progress/${jobId}`,
    url: `http://localhost:${PORT}/renders/${jobId}.mp4`,
  })
})

/* --------------------------------------------------
   CORE RENDER ENGINE
-------------------------------------------------- */

function renderTimelineToVideo(timeline, outputPath, jobId) {
  return new Promise((resolve, reject) => {
    let state = {
      jobId,
      status: "starting",
      percent: 0,
      stage: "initializing",
    }

    renderJobs.set(jobId, state)

    const command = ffmpeg()

    // Add inputs
    timeline.forEach((clip) => {
      command.addInput(clip.src)
    })

    command
      .on("start", () => {
        state.status = "rendering"
        state.stage = "ffmpeg-started"
        renderJobs.set(jobId, { ...state })
      })

      .on("progress", (progress) => {
        state.percent = Math.min(progress.percent || 0, 95)
        state.stage = "encoding"

        renderJobs.set(jobId, { ...state })
      })

      .on("end", () => {
        state.status = "done"
        state.percent = 100
        state.stage = "completed"

        renderJobs.set(jobId, { ...state })

        resolve(outputPath)
      })

      .on("error", (err) => {
        state.status = "error"
        state.stage = "failed"

        renderJobs.set(jobId, { ...state })

        reject(err)
      })

      .mergeToFile(outputPath, "./temp")
  })
}

/* --------------------------------------------------
   SSE PROGRESS STREAM
-------------------------------------------------- */

app.get("/render-progress/:jobId", (req, res) => {
  const { jobId } = req.params

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  const interval = setInterval(() => {
    const job = renderJobs.get(jobId)

    if (!job) return

    res.write(`data: ${JSON.stringify(job)}\n\n`)

    if (job.status === "done" || job.status === "error") {
      clearInterval(interval)
      res.end()
    }
  }, 500)
})

/* --------------------------------------------------
   SERVE RENDERED FILES
-------------------------------------------------- */

app.use("/renders", express.static("renders"))

/* --------------------------------------------------
   START SERVER
-------------------------------------------------- */

app.listen(PORT, () => {
  console.log(`🎬 Render engine running on http://localhost:${PORT}`)
})
