package dify

import (
	"encoding/json"
	"testing"

	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/stretchr/testify/require"
)

func TestRequestOpenAI2DifyRemoteImageDoesNotPanic(t *testing.T) {
	request := dto.GeneralOpenAIRequest{
		User: json.RawMessage(`"user-1"`),
		Messages: []dto.Message{
			{
				Role: "user",
				Content: []any{
					dto.MediaContent{
						Type: dto.ContentTypeImageURL,
						ImageUrl: &dto.MessageImageUrl{
							Url:      "https://example.com/image.png",
							MimeType: "image/png",
						},
					},
				},
			},
		},
	}

	converted := requestOpenAI2Dify(nil, &relaycommon.RelayInfo{}, request)

	require.NotNil(t, converted)
	require.Len(t, converted.Files, 1)
	require.Equal(t, "image/png", converted.Files[0].Type)
	require.Equal(t, "remote_url", converted.Files[0].TransferMode)
	require.Equal(t, "https://example.com/image.png", converted.Files[0].URL)
}
