package storage

import (
	"os"
	"os/exec"
)

func MergeVideos(output string, files []string) error {

	// Create file list for ffmpeg
	listFile := "output/filelist.txt"

	content := ""

	for _, file := range files {
		content += "file '" + file + "'\n"
	}

	err := os.WriteFile(listFile, []byte(content), 0644)
	if err != nil {
		return err
	}

	cmd := exec.Command(
		"ffmpeg",
		"-f", "concat",
		"-safe", "0",
		"-i", listFile,
		"-c", "copy",
		output,
	)

	return cmd.Run()
}