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

  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [finalMovieUrl, setFinalMovieUrl] = useState("")

  const timelineRef = useRef(null)
  const [draggedIndex, setDraggedIndex] = useState(null)

  const [resizingIndex, setResizingIndex] = useState(null)
  const [startX, setStartX] = useState(0)

  // --------------------------------------------------
  // AUDIO + SUBTITLES
  // --------------------------------------------------

  const audioTracks = [
    {
      id: 1,
      name: "Cinematic Theme",
      duration: "2:14",
    },
    {
      id: 2,
      name: "Ambient Tension",
      duration: "1:42",
    },
  ]

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

      const generatedJobs = data.jobs || []

      setJobs(generatedJobs)

      saveProject(generatedJobs)

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
    if (jobs.length === 0) return

    const interval = setInterval(() => {

      setCurrentScene((prev) => {

        const next = prev + 1

        if (next >= jobs.length) {
          setIsPlaying(false)
          return prev
        }

        return next
      })

    }, 4000)

    return () => clearInterval(interval)

  }, [isPlaying, jobs])

  useEffect(() => {

  function onMouseMove(e) {
  if (resizingIndex === null) return

  const diff = e.clientX - startX

  const updatedJobs = [...jobs]

  // convert current duration safely
  let newDuration =
    Number(updatedJobs[resizingIndex].duration) + diff / 50

  if (newDuration < 1) newDuration = 1

  updatedJobs[resizingIndex] = {
    ...updatedJobs[resizingIndex],
    duration: newDuration,
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

 function handleResizeStart(e, index) {
  setResizingIndex(index)
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

  function openPreview(job) {
    setSelectedJob(job)
  }

  function startMovie() {
    setIsPlaying(true)
    setCurrentScene(0)
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

  function exportMovie() {

    setIsExporting(true)
    setExportProgress(0)

    let progress = 0

    const interval = setInterval(() => {

      progress += 10

      setExportProgress(progress)

      if (progress >= 100) {

        clearInterval(interval)

        setIsExporting(false)

        setFinalMovieUrl(
          "https://samplelib.com/lib/preview/mp4/sample-20s.mp4"
        )
      }

    }, 700)
  }

  // --------------------------------------------------
  // PROJECT FUNCTIONS
  // --------------------------------------------------

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
            display: "flex",
            gap: "20px",
            overflowX: "auto",
            marginTop: "20px",
            width: "100%",
            minWidth: "120px",
          }}
        >

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
                onClick={() => openPreview(job)}
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                style={{
                  position:"relative",
                  minWidth: "220px",
                  background: isDone
                    ? "#14532d"
                    : "#1e293b",

                  border: isPlayingScene
                    ? "2px solid #38bdf8"
                    : isCurrent
                      ? "2px solid #a855f7"
                      : "2px solid transparent",

                  transform: isPlayingScene
                    ? "scale(1.05)"
                    : "scale(1)",

                  animation: isPlayingScene
                    ? "pulseGlow 1.5s infinite"
                    : "none",

                  borderRadius: "16px",
                  padding: "20px",
                  transition: "0.4s",
                  cursor: "pointer",
                  opacity: draggedIndex === index ? 0.5 : 1,

                }}
              >

                {/* THUMBNAIL */}

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

                {/* TITLE */}

                <h3 style={{ marginTop: "15px" }}>
                  🎬 Scene {job.scene_number}
                </h3>

                {/* DURATION */}

                <p style={{ color: "#94a3b8" }}>
                  Duration: {job.duration}s
              
                </p>

                  <div
  onMouseDown={(e) => handleResizeStart(e, index)}
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

          {audioTracks.map((track) => (

            <div
              key={track.id}
              style={{
                background: "#14532d",
                padding: "20px",
                borderRadius: "12px",
              }}
            >

              <h4>{track.name}</h4>

              <p>{track.duration}</p>

            </div>
          ))}

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