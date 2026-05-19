package models

type VideoJob struct {
	SceneNumber int    `json:"scene_number"`
	Prompt      string `json:"prompt"`
	JobID       string `json:"job_id"`
	Status      string `json:"status"`
	VideoURL    string `json:"video_url"`
}