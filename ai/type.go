package ai

// -------------------------
// GENERATE VIDEO RESPONSE
// -------------------------
type VideoGenerationResponse struct {
	JobID string `json:"job_id"`
	Status string `json:"status"`
}

// -------------------------
// VIDEO STATUS RESPONSE
// -------------------------
type VideoStatusResponse struct {
	JobID string `json:"job_id"`
	Status string `json:"status"`
	Progress int `json:"progress"`
	VideoURL string `json:"video_url"`
}