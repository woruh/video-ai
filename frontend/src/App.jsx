import { useState, useEffect } from "react"

function App() {

  const [story, setStory] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [jobs, setJobs] = useState([])
  const [savedProjects, setSavedProjects] = useState([])
  const socket = new WebSocket("ws://localhost:8080/ws")

  // ----------------------------
  // GENERATE MOVIE
  // ----------------------------
  async function generateMovie() {

    setLoading(true)

    try {

      const response = await fetch("http://localhost:8080/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          story: story,
        }),
      })

      const data = await response.json()

      setResult(data)
      setJobs(data.jobs || [])
      const newProject = {
  id: Date.now(),
  title: story.slice(0, 30) || "Untitled Project",
  story: story,
  jobs: data.jobs || [],
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


    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  // ----------------------------
  // CHECK STATUS
  // ----------------------------
  async function checkStatus(jobId) {

    const res = await fetch(
      `http://localhost:8080/status?id=${jobId}`
    )

    return await res.json()
  }

  useEffect(() => {

  const saved = localStorage.getItem("quietmoon-projects")

  if (saved) {
    setSavedProjects(JSON.parse(saved))
  }
  socket.onmessage = (event) => {

  const updatedJob = JSON.parse(event.data)

  setJobs((prev) =>
    prev.map((job) =>
      job.job_id === updatedJob.job_id
        ? updatedJob
        : job
    )
  )
}

}, [])

  // ----------------------------
  // POLLING
  // ----------------------------
  useEffect(() => {

  if (jobs.length === 0) return

  let isCompleted = false

  const interval = setInterval(async () => {

    const updatedJobs = await Promise.all(
      jobs.map(async (job) => {

        const status = await checkStatus(job.job_id)

        if (status.status === "completed") {
          isCompleted = true
        }

        return {
          ...job,
          status: status.status,
          progress: status.progress,
          video_url: status.video_url,
        }
      })
    )

    
    setJobs(updatedJobs)

    // 🛑 STOP POLLING WHEN ALL DONE
    if (isCompleted) {
      clearInterval(interval)
    }

  }, 2000) // faster updates (2s instead of 5s)

  return () => clearInterval(interval)

}, [jobs])


  // ----------------------------
  // UI
  // ----------------------------
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

  function loadProject(project) {

  setStory(project.story)

  setJobs(project.jobs || [])

  setResult({
    message: "Project loaded"
  })
}

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "40px",
        fontFamily: "Arial"
      }}
    >

      <h1 style={{ fontSize: "42px" }}>
        🎬 QuietMoon Studio
      </h1>

      <p style={{ color: "#94a3b8" }}>
        Turn stories into cinematic AI movies
      </p>

      <br />

      <textarea
        rows="8"
        cols="70"
        placeholder="Write your cinematic story..."
        value={story}
        onChange={(e) => setStory(e.target.value)}
        style={{
          padding: "20px",
          borderRadius: "12px",
          border: "none",
          fontSize: "16px",
          width: "100%",
          maxWidth: "700px",
          background: "#1e293b",
          color: "white"
        }}
      />

      <br /><br />

      <button
        onClick={generateMovie}
        style={{
          padding: "15px 30px",
          fontSize: "16px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          background: "#7c3aed",
          color: "white",
          fontWeight: "bold"
        }}
      >
        Generate Movie
      </button>

      <br /><br />

      {loading && (
        <p style={{ color: "#cbd5e1" }}>
          ⚡ Starting AI generation...
        </p>
      )}
<div style={{ marginTop: "40px" }}>

  <h2>📁 Saved Projects</h2>

  {savedProjects.length === 0 && (
    <p style={{ color: "#94a3b8" }}>
      No saved projects yet
    </p>
  )}

  {savedProjects.map((project) => (

    <div
      key={project.id}
      style={{
        background: "#1e293b",
        padding: "15px",
        borderRadius: "12px",
        marginTop: "15px",
        border: "1px solid #334155"
      }}
    >

    <h3 style={{ marginBottom: "10px" }}>
  🎬 {project.title}
</h3>

      <p>
        <strong>Created:</strong>
        {" "}
        {project.createdAt}
      </p>

      <p style={{ marginTop: "10px" }}>
        {project.story.slice(0, 120)}...
      </p>

<button
  onClick={() => loadProject(project)}
  style={{
    marginTop: "12px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#7c3aed",
    color: "white"
  }}
  
>
  Open Project
</button>
<button
  onClick={() => deleteProject(project.id)}
  style={{
    marginTop: "12px",
    marginLeft: "10px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#dc2626",
    color: "white"
  }}
>
  Delete
</button>
<button
  onClick={() => renameProject(project.id)}
  style={{
    marginTop: "12px",
    marginLeft: "10px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#2563eb",
    color: "white"
  }}
>
  Rename
</button>

    </div>

  ))}

</div>

      {result && (
        <div>

          <h2 style={{ marginTop: "40px" }}>
            🎥 Scene Jobs
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
              marginTop: "20px"
            }}
          >

            {jobs.map((job, index) => (

              <div
  key={index}
  style={{
    background:
      job.status === "completed"
        ? "#14532d"
        : "#1e293b",

    padding: "20px",
    borderRadius: "16px",

    boxShadow:
      job.status === "completed"
        ? "0 0 20px rgba(34,197,94,0.4)"
        : "0 0 10px rgba(0,0,0,0.3)",

    border:
      job.status === "completed"
        ? "1px solid #22c55e"
        : "1px solid #334155",

    transition: "0.5s"
  }}
>

                <h3>
                  🎬 Scene {job.scene_number}
                </h3>

<div
  style={{
    height: "160px",
    borderRadius: "12px",
    background:
      job.status === "completed"
        ? "linear-gradient(to right, #4f46e5, #7c3aed)"
        : "#0f172a",

    marginTop: "15px",
    marginBottom: "15px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: "50px"
  }}
>
  {job.status === "completed"
    ? "🎥"
    : "⚡"}
</div>

                <p>
                  Status:
                  {" "}
                 <strong
  style={{
    color:
      job.status === "completed"
        ? "#4ade80"
        : "#facc15"
  }}
>
  {job.status === "completed"
    ? "✅ Completed"
    : "⏳ Processing"}
</strong>
                </p>

                {/* Progress Bar */}
                <div
                  style={{
                    background: "#334155",
                    borderRadius: "10px",
                    overflow: "hidden",
                    height: "20px",
                    marginTop: "12px"
                  }}
                >
                  <div
                    style={{
                      width: `${job.progress || 0}%`,
                      background: "#7c3aed",
                      height: "100%",
                      transition: "0.5s"
                    }}
                  />
                </div>

                <p style={{ marginTop: "8px" }}>
                  {job.progress || 0}%
                </p>

                {job.video_url && (
                  <div>

                    <p style={{ color: "#38bdf8" }}>
                      🎥 Video Ready
                    </p>

                    <a
                      href={job.video_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#a78bfa"
                      }}
                    >
                      Watch Video
                    </a>

                  </div>
                )}

              </div>

            ))}

          </div>

        </div>
      )}

    </div>
  )
}

export default App