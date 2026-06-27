package doubao

import "testing"

func TestDoubaoVideoTaskURLUsesDefaultAPIPath(t *testing.T) {
	got := doubaoVideoTaskURL("https://ark.cn-beijing.volces.com", "")
	want := "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks"
	if got != want {
		t.Fatalf("unexpected submit URL: got %q want %q", got, want)
	}
}

func TestDoubaoVideoTaskURLPreservesAgentPlanAPIPath(t *testing.T) {
	got := doubaoVideoTaskURL("https://ark.cn-beijing.volces.com/api/plan/v3/", "task-123")
	want := "https://ark.cn-beijing.volces.com/api/plan/v3/contents/generations/tasks/task-123"
	if got != want {
		t.Fatalf("unexpected fetch URL: got %q want %q", got, want)
	}
}
