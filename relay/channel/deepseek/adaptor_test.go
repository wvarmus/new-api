package deepseek

import (
	"testing"

	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/stretchr/testify/require"
)

func TestConvertOpenAIRequestDeepSeekV4MaxThinkingSuffix(t *testing.T) {
	request := &dto.GeneralOpenAIRequest{
		Model: "deepseek-v4-flash-max",
	}
	info := &relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{UpstreamModelName: "deepseek-v4-flash-max"},
	}

	converted, err := (&Adaptor{}).ConvertOpenAIRequest(nil, info, request)

	require.NoError(t, err)
	convertedRequest, ok := converted.(*dto.GeneralOpenAIRequest)
	require.True(t, ok)
	require.Equal(t, "deepseek-v4-flash", convertedRequest.Model)
	require.JSONEq(t, `{"type":"enabled"}`, string(convertedRequest.THINKING))
	require.Equal(t, "max", convertedRequest.ReasoningEffort)
	require.Equal(t, "deepseek-v4-flash", info.UpstreamModelName)
	require.Equal(t, "max", info.ReasoningEffort)
}

func TestConvertOpenAIRequestDeepSeekV4NoneThinkingSuffix(t *testing.T) {
	request := &dto.GeneralOpenAIRequest{
		Model: "deepseek-v4-pro-none",
	}
	info := &relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{UpstreamModelName: "deepseek-v4-pro-none"},
	}

	converted, err := (&Adaptor{}).ConvertOpenAIRequest(nil, info, request)

	require.NoError(t, err)
	convertedRequest, ok := converted.(*dto.GeneralOpenAIRequest)
	require.True(t, ok)
	require.Equal(t, "deepseek-v4-pro", convertedRequest.Model)
	require.JSONEq(t, `{"type":"disabled"}`, string(convertedRequest.THINKING))
	require.Equal(t, "", convertedRequest.ReasoningEffort)
	require.Equal(t, "deepseek-v4-pro", info.UpstreamModelName)
	require.Equal(t, "", info.ReasoningEffort)
}

func TestConvertClaudeRequestDeepSeekV4MaxThinkingSuffix(t *testing.T) {
	request := &dto.ClaudeRequest{
		Model: "deepseek-v4-pro-max",
	}
	info := &relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{UpstreamModelName: "deepseek-v4-pro-max"},
	}

	converted, err := (&Adaptor{}).ConvertClaudeRequest(nil, info, request)

	require.NoError(t, err)
	convertedRequest, ok := converted.(*dto.ClaudeRequest)
	require.True(t, ok)
	require.Equal(t, "deepseek-v4-pro", convertedRequest.Model)
	require.NotNil(t, convertedRequest.Thinking)
	require.Equal(t, "enabled", convertedRequest.Thinking.Type)
	require.JSONEq(t, `{"effort":"max"}`, string(convertedRequest.OutputConfig))
	require.Equal(t, "deepseek-v4-pro", info.UpstreamModelName)
	require.Equal(t, "max", info.ReasoningEffort)
}
