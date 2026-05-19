package ai

import (
	"sync"
	"time"
)

// -------------------------
// GLOBAL JOB STORAGE
// -------------------------
var jobStore = make(map[string]VideoStatusResponse)

var mutex sync.Mutex

// -------------------------
// GENERATE VIDEO
// -------------------------
func (c *Client) GenerateVideo(prompt string) (VideoGenerationResponse, error) {

	jobID := "job-" + time.Now().Format("150405")

	job := VideoStatusResponse{
		JobID:    jobID,
		Status:   "processing",
		Progress: 0,
		VideoURL: "",
	}

	mutex.Lock()
	jobStore[jobID] = job
	mutex.Unlock()

	go simulateProcessing(jobID)

	return VideoGenerationResponse{
		JobID:  jobID,
		Status: "processing",
	}, nil
}

// -------------------------
// CHECK JOB STATUS
// -------------------------
func (c *Client) CheckJob(jobID string) (VideoStatusResponse, error) {

	mutex.Lock()
	job := jobStore[jobID]
	mutex.Unlock()

	return job, nil
}

// -------------------------
// SIMULATE PROCESSING
// -------------------------
func simulateProcessing(jobID string) {

	progressSteps := []int{10, 25, 45, 60, 80, 100}

	for _, p := range progressSteps {

	time.Sleep(3 * time.Second)

	mutex.Lock()

	job := jobStore[jobID]
	job.Progress = p

	if p < 100 {
		job.Status = "processing"
	}

	if p == 100 {
		job.Status = "completed"
		job.VideoURL = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
	}

	jobStore[jobID] = job

	mutex.Unlock()

	// 🔥 SEND LIVE UPDATE
	broadcast(job)
}
}
