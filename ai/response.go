package ai

type VideoResponse struct {
	JobID   string `json:"job_id"`
	Status  string `json:"status"`
	VideoURL string `json:"video_url"`
}