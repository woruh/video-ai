import { useEffect, useRef, useState } from "react"

function App() {

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [story, setStory] = useState("")
  const [loading, setLoading] = useState(false)

  const [jobs, setJobs] = useState([])
  const [savedProjects, setSavedProjects] = useState([])

  const [selectedJob, setSelectedJob] = useState(null)

  const [activeIndex, setActiveIndex] = useState(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentScene, setCurrentScene] = useState(0)
  const [playheadPosition, setPlayheadPosition] = useState(0)

  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [finalMovieUrl, setFinalMovieUrl] = useState("")
  const [exportStage, setExportStage] = useState("idle")
  // 🎧 AUDIO SYNC ENGINE STATE
const [audioBpm] = useState(120)
const [beatMap, setBeatMap] = useState([])
const [playbackTime, setPlaybackTime] = useState(0)
const [nextBeatIndex, setNextBeatIndex] = useState(0)
const [intensity, setIntensity] = useState(0.5)

  const timelineRef = useRef(null)
  const [draggedIndex, setDraggedIndex] = useState(null)

  const [resizingIndex, setResizingIndex] = useState(null)
  const [resizeSide, setResizeSide] = useState(null)
  const [startX, setStartX] = useState(0)
 
  const [emotionMap, setEmotionMap] = useState([])
const [currentEmotion, setCurrentEmotion] = useState("neutral")
const [directorPlan, setDirectorPlan] = useState([])

  const [rendering, setRendering] = useState(false)
const [renderProgress, setRenderProgress] = useState(0)
  // --------------------------------------------------
  // AUDIO + SUBTITLES
  // --------------------------------------------------

  const audioTracks = [
   {
  id: 1,
  name: "Cinematic Theme",
  duration: "2:14",

  waveform: [
    20, 40, 60, 30, 80,
    50, 70, 90, 40, 60,
    20, 50, 75, 30, 60,
  ],
},
   {
  id: 2,
  name: "Ambient Tension",
  duration: "1:42",

  waveform: [
    10, 20, 50, 80, 40,
    20, 60, 90, 50, 30,
    70, 40, 60, 20, 10,
  ],
},
  ]

  const TRANSITIONS = {
  none: { duration: 0 },
  fade: { duration: 0.5 },
  dissolve: { duration: 1 },
  blur: { duration: 0.7 },
}

  const subtitles = [
    {
      id: 1,
      text: "The journey begins...",
    },
    {
      id: 2,
      text: "A mysterious shadow appears...",
    },
    {
      id: 3,
      text: "Everything changes forever.",
    },
  ]

  // --------------------------------------------------
  // GENERATE MOVIE
  // --------------------------------------------------

  async function generateMovie() {

    setLoading(true)

    try {

      const response = await fetch(
        "http://localhost:8080/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            story,
          }),
        }
      )

      const data = await response.json()

      const generatedJobs = (data.jobs || []).map((job) => ({
  ...job,

  startTime: 0,

  duration:
    Math.floor(Math.random() * 8) + 5,
})).map((job) => ({
  ...job,

  endTime:
    job.startTime + job.duration,
}))

  const enrichedJobs = generatedJobs.map((job, index) => {

  const text = story.toLowerCase()

  // 🎭 DEFAULT EMOTION
  let emotion = "neutral"

  // 🧠 GLOBAL STORY SIGNALS
  const isLove = text.includes("love") || text.includes("happy")
  const isDark = text.includes("dark") || text.includes("fear")
  const isAction = text.includes("war") || text.includes("fight")
  const isMystery = text.includes("mystery")

  // 🎬 SCENE-AWARE VARIATION (IMPORTANT UPGRADE)
  const sceneFactor = index / generatedJobs.length

  if (isAction) {
    emotion = sceneFactor > 0.5 ? "intense" : "neutral"
  } 
  else if (isDark) {
    emotion = sceneFactor > 0.3 ? "dark" : "mysterious"
  } 
  else if (isLove) {
    emotion = sceneFactor > 0.5 ? "happy" : "calm"
  } 
  else if (isMystery) {
    emotion = sceneFactor > 0.4 ? "mysterious" : "neutral"
  }

 return {
  ...job,
  emotion,
  script: generateSceneScript(job, index, emotion),

  // 🎬 NEW: SHOT ENGINE OUTPUT
  shot: generateShot(job, emotion)
}
})

setJobs(enrichedJobs)
saveProject(enrichedJobs)

    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  // --------------------------------------------------
  // SAVE PROJECT
  // --------------------------------------------------

  function saveProject(projectJobs) {

    const newProject = {
      id: Date.now(),
      title: story.slice(0, 30) || "Untitled Project",
      story,
      jobs: projectJobs,
      createdAt: new Date().toLocaleString(),
    }

    const updatedProjects = [
      newProject,
      ...savedProjects,
    ]

    setSavedProjects(updatedProjects)

    localStorage.setItem(
      "quietmoon-projects",
      JSON.stringify(updatedProjects)
    )
  }

  // --------------------------------------------------
  // CHECK STATUS
  // --------------------------------------------------

  async function checkStatus(jobId) {

    const response = await fetch(
      `http://localhost:8080/status?id=${jobId}`
    )

    return await response.json()
  }

  // --------------------------------------------------
  // POLLING
  // --------------------------------------------------

  useEffect(() => {

    if (jobs.length === 0) return

    const interval = setInterval(async () => {

      const updatedJobs = await Promise.all(

        jobs.map(async (job) => {

          const status = await checkStatus(job.job_id)

          return {
            ...job,
            status: status.status,
            progress: status.progress,
            video_url: status.video_url,
           duration: Math.floor(Math.random() * 8) + 5,
           transition: "none",
            thumbnail: generateThumbnail(job.scene_number),
          }
        })
      )

      const processingIndex = updatedJobs.findIndex(
        (job) => job.status === "processing"
      )

      setActiveIndex(processingIndex)

      setJobs(updatedJobs)

    }, 2000)

    return () => clearInterval(interval)

  }, [jobs])

  // --------------------------------------------------
  // PLAYBACK
  // --------------------------------------------------

 useEffect(() => {

  if (!isPlaying) return

  const interval = setInterval(() => {

    setPlaybackTime((t) => t + 0.25)

    setCurrentScene((prev) => {
      const next = prev + 1
      if (next >= jobs.length) {
        setIsPlaying(false)
        return prev
      }
      return next
    })

  }, 250)

  return () => clearInterval(interval)

}, [isPlaying, jobs])

useEffect(() => {

  if (!isPlaying) return
  if (beatMap.length === 0) return

  const interval = setInterval(() => {

    const beatTime = beatMap[nextBeatIndex]

    if (beatTime === undefined) return

    // 🎧 CHECK IF WE HIT A BEAT
    if (playbackTime >= beatTime) {

      // 🎬 CUT TO NEXT SCENE ON BEAT
      setCurrentScene((prev) => {
        const next = prev + 1

        if (next >= jobs.length) {
          setIsPlaying(false)
          return prev
        }

        return next
      })

      // move to next beat
      setNextBeatIndex((prev) => prev + 1)
    }

  }, 100)

  return () => clearInterval(interval)

}, [isPlaying, playbackTime, beatMap, nextBeatIndex, jobs])

useEffect(() => {

  if (!isPlaying) return

  const interval = setInterval(() => {

    // simulate energy waves (later replace with real waveform)
    const fakeEnergy =
      0.3 + Math.abs(Math.sin(playbackTime * 0.8)) * 0.7

    setIntensity(fakeEnergy)

  }, 200)

  return () => clearInterval(interval)

}, [isPlaying, playbackTime])

useEffect(() => {

  if (!isPlaying || jobs.length === 0) return

  const currentJob = jobs[currentScene]

  if (!currentJob) return

  setCurrentEmotion(currentJob.emotion || "neutral")

}, [currentScene, isPlaying, jobs])


useEffect(() => {

  if (!timelineRef.current) return

  timelineRef.current.scrollLeft =
    playheadPosition - 200

}, [playheadPosition])

useEffect(() => {

  if (!isPlaying) return

  if (currentEmotion === "dark") {
    setIntensity(0.3)
  }

  if (currentEmotion === "intense") {
    setIntensity(0.9)
  }

  if (currentEmotion === "happy") {
    setIntensity(0.6)
  }

}, [currentEmotion, isPlaying])

  useEffect(() => {

  function onMouseMove(e) {
  if (resizingIndex === null) return

  const diff = e.clientX - startX

  const updatedJobs = [...jobs]

  // convert current duration safely
  const currentJob = updatedJobs[resizingIndex]

if (resizeSide === "right") {

  let newDuration =
    currentJob.duration + diff / 50

  if (newDuration < 1)
    newDuration = 1

  updatedJobs[resizingIndex] = {
    ...currentJob,
    duration: newDuration,
    endTime:
      currentJob.startTime + newDuration,
  }
}

if (resizeSide === "left") {

  let newStart =
    currentJob.startTime + diff / 50

  if (newStart < 0)
    newStart = 0

  let newDuration =
    currentJob.endTime - newStart

  if (newDuration < 1)
    newDuration = 1

  updatedJobs[resizingIndex] = {
    ...currentJob,
    startTime: newStart,
    duration: newDuration,
  }
}

setJobs(updatedJobs)
}

  function onMouseUp() {
    setResizingIndex(null)
  }

  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("mouseup", onMouseUp)

  return () => {
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mouseup", onMouseUp)
  }

}, [resizingIndex, startX, jobs])

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

 function handleResizeStart(e, index, side) {

  setResizingIndex(index)

  setResizeSide(side)

  setStartX(e.clientX)
}

  function generateThumbnail(sceneNumber) {

    const images = [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
    ]

    return images[sceneNumber % images.length]
  }

  function generateSceneScript(job, index, emotion) {

  const base = job.scene_number || index + 1

  let narration = ""
  let camera = ""
  let action = ""

  switch (emotion) {

    case "dark":
      narration = "A shadow grows across the frame, tension rises."
      camera = "slow push-in"
      action = "low light, heavy contrast"
      break

    case "intense":
      narration = "Everything accelerates into chaos and motion."
      camera = "handheld shake"
      action = "fast cuts, rapid movement"
      break

    case "mysterious":
      narration = "Something unknown begins to reveal itself."
      camera = "slow zoom"
      action = "fog, soft focus"
      break

    case "happy":
      narration = "Light fills the scene with warmth and hope."
      camera = "smooth pan"
      action = "bright lighting, open framing"
      break

    default:
      narration = "The scene unfolds with quiet progression."
      camera = "static shot"
      action = "neutral environment"
  }

  return {
    scene: base,
    narration,
    camera,
    action
  }
}

  function openPreview(job) {
    setSelectedJob(job)
  }

 function startMovie() {
  setIsPlaying(true)
  setCurrentScene(0)
  setPlaybackTime(0)
  setNextBeatIndex(0)

  const beats = generateBeatMap(audioBpm, jobs.length * 6)
  setBeatMap(beats)
}

function jumpToScene(index) {

  setCurrentScene(index)

  const targetPosition =
    jobs
      .slice(0, index)
      .reduce(
        (total, job) =>
          total + (job.duration * 60),
        0
      )

  setPlayheadPosition(targetPosition)
}

function generateShot(job, emotion) {

  const baseScene = job.scene_number || 1

  let prompt = ""
  let style = ""
  let camera = ""

  switch (emotion) {

    case "dark":
      prompt = "cinematic dark environment, shadows, dramatic lighting, film noir style"
      style = "moody, high contrast, desaturated colors"
      camera = "low angle slow push-in"
      break

    case "intense":
      prompt = "action scene, motion blur, explosive cinematic energy, war atmosphere"
      style = "high energy, dynamic lighting, sharp contrast"
      camera = "handheld shaky cam, fast zoom"
      break

    case "mysterious":
      prompt = "foggy cinematic scene, unknown figure, atmospheric lighting, suspense"
      style = "soft focus, blue tones, cinematic fog"
      camera = "slow zoom, depth focus shift"
      break

    case "happy":
      prompt = "bright cinematic scene, warm sunlight, uplifting atmosphere, natural beauty"
      style = "warm tones, soft lighting, vibrant colors"
      camera = "smooth dolly shot"
      break

    default:
      prompt = "cinematic scene, natural lighting, film composition"
      style = "neutral cinematic grade"
      camera = "static professional framing"
  }

  return {
    scene: baseScene,
    prompt,
    style,
    camera
  }
}

async function renderScene(job) {

  // simulate AI render API call
  const response = await fetch("http://localhost:8080/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: job.shot.prompt,
      style: job.shot.style,
      camera: job.shot.camera,
      emotion: job.emotion
    })
  })

  const data = await response.json()

  return data.media_url
}

async function renderMovie() {

  setRendering(true)
  setRenderProgress(0)

  const updatedJobs = [...jobs]

  for (let i = 0; i < updatedJobs.length; i++) {

    const job = updatedJobs[i]

    setRenderProgress(Math.floor((i / updatedJobs.length) * 100))

    try {

      const mediaUrl = await renderScene(job)

      updatedJobs[i] = {
        ...job,
        media_url: mediaUrl
      }

      setJobs([...updatedJobs])

    } catch (err) {
      console.error("Render failed:", err)
    }
  }

  setRenderProgress(100)
  setRendering(false)

  setFinalMovieUrl("https://samplelib.com/lib/preview/mp4/sample-20s.mp4")
}


function buildRenderTimeline(jobs) {

  return jobs.map((job, index) => {

    return {
      id: job.job_id || index,
      src: job.media_url,
      duration: job.duration || 5,

      // 🎬 stitching metadata
      transition: job.transition || "cut",
      emotion: job.emotion || "neutral",
      camera: job.shot?.camera || "static",

      startTime: 0, // will be calculated later
      endTime: 0
    }
  })
}

  // --------------------------------------------------
  // EXPORT MOVIE
  // --------------------------------------------------

function handleDrop(targetIndex) {
  if (draggedIndex === null) return

  setJobs((prev) => {
    const updated = [...prev]
    const [removed] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, removed)
    return updated
  })

  setDraggedIndex(null)
}

function splitClip(index) {

  const updatedJobs = [...jobs]

  const clip = updatedJobs[index]

  const middle =
    clip.startTime + (clip.duration / 2)

  const firstHalf = {
    ...clip,

    id: Date.now(),

    endTime: middle,

    duration:
      middle - clip.startTime,
  }

  const secondHalf = {
    ...clip,

    id: Date.now() + 1,

    startTime: middle,

    duration:
      clip.endTime - middle,
  }

  updatedJobs.splice(index, 1)

  updatedJobs.splice(index, 0, firstHalf)

  updatedJobs.splice(index + 1, 0, secondHalf)

  setJobs(updatedJobs)
}

function setTransition(index, type) {

  const updatedJobs = [...jobs]

  updatedJobs[index] = {
    ...updatedJobs[index],
    transition: type,
  }

  setJobs(updatedJobs)
}

 function exportMovie() {

  setIsExporting(true)
  setExportProgress(0)
  setExportStage("analyzing")

  const timeline = buildRenderTimeline(jobs)
  const totalScenes = timeline.length

  let currentScene = 0
  let progress = 0

  const interval = setInterval(() => {

    const job = timeline[currentScene]

    // ❗ END CONDITION
    if (!job) {
      clearInterval(interval)

      setExportStage("finalizing")

      setTimeout(() => {
        setIsExporting(false)
        setExportStage("done")
        setExportProgress(100)

        setFinalMovieUrl(
          "https://samplelib.com/lib/preview/mp4/sample-20s.mp4"
        )
      }, 1500)

      return
    }

    // 🎬 TRANSITION LOGIC
    if (job.transitionDuration > 0) {
      setExportStage(`transition:${job.transition}`)
    } else {
      setExportStage("rendering")
    }

    // 🎞 SIMULATE RENDER SPEED
    const renderSpeed = (job.duration || 5) * 2

    progress += 100 / totalScenes / renderSpeed

    setExportProgress(Math.min(progress, 99))

    // 🎬 ADVANCE SCENE WHEN DONE
    const sceneThreshold = (currentScene + 1) * (100 / totalScenes)

    if (progress >= sceneThreshold) {
      currentScene++
    }

  }, 200)
}

  // --------------------------------------------------
  // PROJECT FUNCTIONS
  // --------------------------------------------------

  function generateBeatMap(bpm = 120, duration = 60) {
  const beats = []
  const interval = 60 / bpm

  for (let t = 0; t < duration; t += interval) {
    beats.push(t)
  }

  return beats
}
 
  function buildRenderTimeline(jobs) {

  let timeline = []
  let currentTime = 0

  jobs.forEach((job, index) => {

    const transition = TRANSITIONS[job.transition || "none"]

    const startTime = currentTime

    const duration = Number(job.duration) || 5

    const endTime = startTime + duration

    timeline.push({
      ...job,
      startTime,
      endTime,
      transitionDuration: transition.duration,
    })

    // NEXT SCENE START ADJUSTED BY TRANSITION OVERLAP
    currentTime = endTime - transition.duration
  })

  return timeline
}
  
  function deleteProject(projectId) {

    const updatedProjects = savedProjects.filter(
      (project) => project.id !== projectId
    )

    setSavedProjects(updatedProjects)

    localStorage.setItem(
      "quietmoon-projects",
      JSON.stringify(updatedProjects)
    )
  }

  function renameProject(projectId) {

    const newTitle = prompt("Enter new project title")

    if (!newTitle) return

    const updatedProjects = savedProjects.map((project) => {

      if (project.id === projectId) {
        return {
          ...project,
          title: newTitle,
        }
      }

      return project
    })

    setSavedProjects(updatedProjects)

    localStorage.setItem(
      "quietmoon-projects",
      JSON.stringify(updatedProjects)
    )
  }

  function loadProject(project) {

    setStory(project.story)

    setJobs(project.jobs || [])
  }

  function calculateTimeline(timeline) {

  let currentTime = 0

  return timeline.map((clip) => {

    const startTime = currentTime
    const endTime = currentTime + clip.duration

    currentTime = endTime

    return {
      ...clip,
      startTime,
      endTime
    }
  })
}

function stitchMovie(jobs) {

  // 1. Build timeline
  let timeline = buildRenderTimeline(jobs)

  // 2. Apply timing
  timeline = calculateTimeline(timeline)

  // 3. Apply transitions (simulation layer)
  const stitched = timeline.map((clip, index) => {

    const next = timeline[index + 1]

    let transitionEffect = "cut"

    if (clip.transition === "fade") transitionEffect = "fade"
    if (clip.transition === "flash cut") transitionEffect = "flash"
    if (clip.transition === "slow dissolve") transitionEffect = "dissolve"

    return {
      ...clip,
      nextClip: next?.src || null,
      transitionEffect
    }
  })

  return stitched
}


function exportMovie() {

  setIsExporting(true)
  setExportProgress(0)
  setExportStage("stitching")

  const timeline = stitchMovie(jobs)

  let progress = 0
  let index = 0

  const interval = setInterval(() => {

    const clip = timeline[index]

    if (!clip) {
      clearInterval(interval)

      setExportStage("finalizing")

      setTimeout(() => {

        setIsExporting(false)
        setExportProgress(100)
        setExportStage("done")

        setFinalMovieUrl(
          "https://samplelib.com/lib/preview/mp4/sample-20s.mp4"
        )
      }, 1500)

      return
    }

    // 🎬 stage based on clip emotion
    if (clip.emotion === "intense") {
      setExportStage("fast-cut-stitching")
    } else if (clip.emotion === "mysterious") {
      setExportStage("cinematic-dissolve")
    } else {
      setExportStage("standard-cut")
    }

    // progress per clip
    progress += 100 / timeline.length
    setExportProgress(Math.min(progress, 99))

    index++

  }, 400)
}

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >

      {/* ANIMATIONS */}
      <style>
        {`
          @keyframes pulseGlow {
            0% {
              box-shadow: 0 0 10px rgba(56,189,248,0.4);
            }

            50% {
              box-shadow: 0 0 30px rgba(56,189,248,0.9);
            }

            100% {
              box-shadow: 0 0 10px rgba(56,189,248,0.4);
            }
          }
        `}
      </style>

      {/* HEADER */}

      <h1 style={{ fontSize: "42px" }}>
        🎬 QuietMoon Studio
      </h1>

      <p style={{ color: "#94a3b8" }}>
        Turn stories into cinematic AI movies
      </p>

      {/* STORY INPUT */}

      <textarea
        rows="8"
        placeholder="Write your cinematic story..."
        value={story}
        onChange={(e) => setStory(e.target.value)}
        style={{
          width: "100%",
          maxWidth: "700px",
          marginTop: "20px",
          padding: "20px",
          borderRadius: "12px",
          border: "none",
          background: "#1e293b",
          color: "white",
          fontSize: "16px",
        }}
      />

      {/* BUTTONS */}

      <div style={{ marginTop: "20px" }}>

        <button onClick={generateMovie}>
          Generate Movie
        </button>

        <button
          onClick={startMovie}
          style={{ marginLeft: "10px" }}
        >
          ▶ Play Movie
        </button>

        <button
          onClick={exportMovie}
          style={{ marginLeft: "10px" }}
        >
          🎬 Export
        </button>

        <button
  onClick={renderMovie}
  style={{ marginLeft: "10px" }}
>
  🎥 AI Render Movie
</button>

      </div>

      {/* LOADING */}

      {loading && (
        <p style={{ marginTop: "20px" }}>
          ⚡ Generating scenes...
        </p>
      )}

      {/* TIMELINE */}

      <div style={{ marginTop: "50px" }}>

        <h2>🎞 Scene Timeline</h2>

        <div
          ref={timelineRef}
          style={{
            position: "relative",
            display: "flex",
            gap: "20px",
            overflowX: "auto",
            marginTop: "20px",
            width: "100%",
            minWidth: "120px",
          }}
        >
          <div
  style={{
    position: "absolute",
    left: `${playheadPosition}px`,
    top: "0",
    width: "4px",
    height: "100%",
    background: "#f43f5e",
    zIndex: 999,
    transition: "0.3s",
  }}
/>



          {jobs.map((job, index) => {
            
            const isActive =
              job.status === "processing"

            const isDone =
              job.status === "completed"

            const isCurrent =
              index === activeIndex

            const isPlayingScene =
              isPlaying && index === currentScene

            return (

              
            <div
                key={index}
                draggable
               onClick={() => {
  openPreview(job)
  jumpToScene(index)
}}
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                style={{
                position:"relative",
                width: `${job.duration * 60}px`,
                minWidth: "120px",
                  background: isDone
                    ? "#14532d"
                    : "#1e293b",

                    border: isPlayingScene
  ? currentEmotion === "dark"
    ? "2px solid #ef4444"   // red = dark emotion
    : currentEmotion === "happy"
      ? "2px solid #22c55e" // green = happy
      : currentEmotion === "intense"
        ? "2px solid #f97316" // orange = action
        : "2px solid #38bdf8" // default
  : "2px solid transparent",

               transform: isPlayingScene
  ? currentEmotion === "intense"
    ? `scale(${1 + intensity * 0.2})`
    : currentEmotion === "dark"
      ? "scale(0.98)"
      : `scale(${1 + intensity * 0.1})`
  : "scale(1)",

transition: intensity > 0.7
  ? "0.1s"
  : "0.4s",

                  animation: isPlayingScene
                    ? "pulseGlow 1.5s infinite"
                    : "none",

                  borderRadius: "16px",
                  padding: "20px",

                  cursor: "pointer",
                  opacity: draggedIndex === index ? 0.5 : 1,

                }}
              >

                {/* THUMBNAIL */}

                {job.media_url ? (

  <video
    src={job.media_url}
    autoPlay
    muted
    loop
    style={{
      width: "100%",
      height: "120px",
      objectFit: "cover",
      borderRadius: "12px",
    }}
  />

) : (

  <img
    src={job.thumbnail}
    alt="scene"
    style={{
      width: "100%",
      height: "120px",
      objectFit: "cover",
      borderRadius: "12px",
    }}
  />
)}

                {/* TITLE */}

              <h3>🎬 Scene {job.scene_number}</h3>

{/* PUT IT RIGHT HERE */}
<div style={{ marginTop: "10px", fontSize: "12px", color: "#94a3b8" }}>
  <p>📝 {job.script?.narration}</p>
  <p>🎥 {job.script?.camera}</p>
</div>

<div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b" }}>
  <p>🎯 Prompt: {job.shot?.prompt}</p>
  <p>🎨 Style: {job.shot?.style}</p>
  <p>📷 Camera: {job.shot?.camera}</p>
</div>

{/* THEN duration */}
<p>Duration: {job.duration}</p>

                {/* DURATION */}

                <p style={{ color: "#94a3b8" }}>
                 Duration: {Math.round(job.duration)}s
              
                </p>
                <p style={{ color: "#64748b" }}>
  {job.startTime}s → {Math.round(job.endTime)}s
</p>
<div
  onMouseDown={(e) =>
    handleResizeStart(e, index, "left")
  }
  style={{
    position: "absolute",
    left: "0",
    top: "0",
    width: "6px",
    height: "100%",
    cursor: "ew-resize",
    background: "rgba(255,255,255,0.1)",
  }}
/>

                  <div
 onMouseDown={(e) =>
  handleResizeStart(e, index, "right")
}
  style={{
    position: "absolute",
    right: "0",
    top: "0",
    width: "6px",
    height: "100%",
    cursor: "ew-resize",
    background: "rgba(255,255,255,0.1)"
  }}
/>
                {/* PROGRESS */}

                <div
                  style={{
                    height: "12px",
                    background: "#334155",
                    borderRadius: "999px",
                    overflow: "hidden",
                    marginTop: "15px",
                  }}
                >

                  <div
                    style={{
                      width: `${job.progress || 0}%`,
                      height: "100%",
                      background: isDone
                        ? "#22c55e"
                        : "#7c3aed",
                    }}
                  />

                </div>
                    <button
  onClick={(e) => {
    e.stopPropagation()
    splitClip(index)
  }}
  style={{
    marginTop: "12px",
    padding: "6px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
  }}
>
  ✂ Split
</button>

<select
  value={job.transition || "none"}
  onChange={(e) =>
    setTransition(index, e.target.value)
  }
  style={{
    marginTop: "10px",
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    background: "#0f172a",
    color: "white",
    border: "1px solid #334155",
  }}
>
  <option value="none">
    No Transition
  </option>

  <option value="fade">
    Fade
  </option>

  <option value="dissolve">
    Dissolve
  </option>

  <option value="blur">
    Blur
  </option>
</select>

                <p style={{ marginTop: "10px" }}>
                  {job.progress || 0}%
                </p>

              </div>
            )
          })}

        </div>

      </div>



      {/* AUDIO TRACK */}

      <div style={{ marginTop: "40px" }}>

        <h2>🔊 Audio Track</h2>

        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "20px",
          }}
        >

         {audioTracks.map((track) => {

  const activeBar =
    playbackTime % track.waveform.length

  return (
    <div
      key={track.id}
      style={{
        minWidth: "700px",
        background: "#111827",
        padding: "20px",
        borderRadius: "14px",
        border: "1px solid #334155",
      }}
    >

      <h4>{track.name}</h4>

      <p style={{ color: "#94a3b8" }}>
        {track.duration}
      </p>

      {/* WAVEFORM */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "4px",
          marginTop: "20px",
          height: "100px",
        }}
      >

        {track.waveform.map((bar, index) => (
          <div
            key={index}
            style={{
              width: "10px",
              height: `${bar}px`,
             background:
  exportStage === "analyzing"
    ? "#facc15"
    : exportStage === "rendering"
      ? "#7c3aed"
      : exportStage === "finalizing"
        ? "#38bdf8"
        : "#22c55e",
              borderRadius: "999px",
              transition: "0.3s",
            }}
          />
        ))}

      </div>

    </div>
  )
})}

        </div>

      </div>

      {/* SUBTITLES */}

      <div style={{ marginTop: "40px" }}>

        <h2>💬 Subtitle Track</h2>

        <div
          style={{
            display: "flex",
            gap: "20px",
            overflowX: "auto",
            marginTop: "20px",
          }}
        >

          {subtitles.map((sub) => (

            <div
              key={sub.id}
              style={{
                minWidth: "250px",
                background: "#713f12",
                padding: "20px",
                borderRadius: "12px",
              }}
            >

              {sub.text}

            </div>
          ))}

        </div>

      </div>

      {/* SAVED PROJECTS */}

      <div style={{ marginTop: "50px" }}>

        <h2>📁 Saved Projects</h2>

        {savedProjects.map((project) => (

          <div
            key={project.id}
            style={{
              background: "#1e293b",
              padding: "20px",
              borderRadius: "12px",
              marginTop: "20px",
            }}
          >

            <h3>
              🎬 {project.title}
            </h3>

            <p style={{ color: "#94a3b8" }}>
              {project.createdAt}
            </p>

            <div style={{ marginTop: "15px" }}>

              <button
                onClick={() => loadProject(project)}
              >
                Open
              </button>

              <button
                onClick={() => renameProject(project.id)}
                style={{ marginLeft: "10px" }}
              >
                Rename
              </button>

              <button
                onClick={() => deleteProject(project.id)}
                style={{ marginLeft: "10px" }}
              >
                Delete
              </button>

            </div>

          </div>
        ))}

      </div>

      {/* EXPORT MODAL */}

      {isExporting && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >

          <div
            style={{
              width: "500px",
              background: "#0f172a",
              padding: "30px",
              borderRadius: "20px",
            }}
          >

            <h1>🎬 Rendering Final Movie...</h1>

            <p style={{ color: "#94a3b8" }}>
  Stage: {exportStage}
</p>

<p style={{ color: "#94a3b8" }}>
  Transition Engine: {exportStage}
</p>

            <div
              style={{
                height: "20px",
                background: "#1e293b",
                borderRadius: "999px",
                overflow: "hidden",
                marginTop: "20px",
              }}
            >

              <div
                style={{
                  width: `${exportProgress}%`,
                  height: "100%",
                  background: "#22c55e",
                }}
              />

            </div>

            <h2 style={{ marginTop: "20px" }}>
              {exportProgress}%
            </h2>

          </div>

        </div>
      )}

      {/* FINAL MOVIE */}

      {finalMovieUrl && (

        <div style={{ marginTop: "50px" }}>

          <h2>🍿 Final Exported Movie</h2>

          <video
            controls
            style={{
              width: "100%",
              maxWidth: "900px",
              borderRadius: "20px",
              marginTop: "20px",
            }}
          >

            <source src={finalMovieUrl} />

          </video>

        </div>
      )}

      {/* PREVIEW MODAL */}

      {selectedJob && (


        <div
          onClick={() => setSelectedJob(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "80%",
              maxWidth: "800px",
              background: "#0f172a",
              padding: "20px",
              borderRadius: "20px",
            }}
          >

            <h2>
              🎬 Scene {selectedJob.scene_number}
            </h2>

            {selectedJob.video_url ? (

              <video
                controls
                autoPlay
                style={{
                  width: "100%",
                  marginTop: "20px",
                  borderRadius: "12px",
                }}
              >

                <source src={selectedJob.video_url} />

              </video>

            ) : (

              <p>⏳ Video not ready yet...</p>

            )}

          </div>

        </div>
      )}

    </div>
  )
}

export default App