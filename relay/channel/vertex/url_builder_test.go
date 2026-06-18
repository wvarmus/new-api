package vertex

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestBuildAPIBaseURLDefaultGlobal(t *testing.T) {
	require.Equal(t, "https://aiplatform.googleapis.com/v1", BuildAPIBaseURL("", DefaultAPIVersion, "", "global"))
	require.Equal(t, "https://aiplatform.googleapis.com/v1/projects/proj/locations/global", BuildAPIBaseURL("", DefaultAPIVersion, "proj", "global"))
}

func TestBuildAPIBaseURLDefaultRegional(t *testing.T) {
	require.Equal(t, "https://us-central1-aiplatform.googleapis.com/v1", BuildAPIBaseURL("", DefaultAPIVersion, "", "us-central1"))
	require.Equal(t, "https://us-central1-aiplatform.googleapis.com/v1/projects/proj/locations/us-central1", BuildAPIBaseURL("", DefaultAPIVersion, "proj", "us-central1"))
}

func TestBuildAPIBaseURLCustomBaseURL(t *testing.T) {
	require.Equal(t, "https://gateway.example.com/vertex/v1", BuildAPIBaseURL("https://gateway.example.com/vertex/", DefaultAPIVersion, "", "global"))
	require.Equal(t, "https://gateway.example.com/vertex/v1/projects/proj/locations/us-central1", BuildAPIBaseURL("https://gateway.example.com/vertex/v1", DefaultAPIVersion, "proj", "us-central1"))
}

func TestBuildPublisherModelURL(t *testing.T) {
	require.Equal(
		t,
		"https://gateway.example.com/vertex/v1/projects/proj/locations/global/publishers/anthropic/models/claude-opus-4-8:rawPredict",
		BuildAnthropicModelURL("https://gateway.example.com/vertex", DefaultAPIVersion, "proj", "global", "claude-opus-4-8", "rawPredict"),
	)
}
