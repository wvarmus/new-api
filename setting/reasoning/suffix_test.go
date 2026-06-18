package reasoning

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseDeepSeekV4ThinkingSuffix(t *testing.T) {
	tests := []struct {
		model        string
		baseModel    string
		thinkingType string
		effort       string
		ok           bool
	}{
		{model: "deepseek-v4-flash-none", baseModel: "deepseek-v4-flash", thinkingType: "disabled", ok: true},
		{model: "deepseek-v4-pro-max", baseModel: "deepseek-v4-pro", thinkingType: "enabled", effort: "max", ok: true},
		{model: "deepseek-chat-max", baseModel: "deepseek-chat-max", ok: false},
		{model: "deepseek-v4-pro-high", baseModel: "deepseek-v4-pro-high", ok: false},
	}

	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			baseModel, thinkingType, effort, ok := ParseDeepSeekV4ThinkingSuffix(tt.model)

			require.Equal(t, tt.ok, ok)
			require.Equal(t, tt.baseModel, baseModel)
			require.Equal(t, tt.thinkingType, thinkingType)
			require.Equal(t, tt.effort, effort)
		})
	}
}

func TestParseOpenAIReasoningEffortFromModelSuffix(t *testing.T) {
	effort, baseModel := ParseOpenAIReasoningEffortFromModelSuffix("gpt-5-high")
	require.Equal(t, "high", effort)
	require.Equal(t, "gpt-5", baseModel)

	effort, baseModel = ParseOpenAIReasoningEffortFromModelSuffix("gpt-4.1")
	require.Equal(t, "", effort)
	require.Equal(t, "gpt-4.1", baseModel)
}
