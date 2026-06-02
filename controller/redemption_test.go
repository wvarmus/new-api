package controller

import (
	"net/http"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

type batchDisableRedemptionsResponse struct {
	Requested       int      `json:"requested"`
	Disabled        int64    `json:"disabled"`
	AlreadyDisabled int      `json:"already_disabled"`
	Used            int      `json:"used"`
	Expired         int      `json:"expired"`
	NotFound        int      `json:"not_found"`
	NotFoundKeys    []string `json:"not_found_keys"`
	SkippedKeys     []string `json:"skipped_keys"`
}

func setupRedemptionControllerTestDB(t *testing.T) {
	t.Helper()

	db := openTokenControllerTestDB(t)
	if err := db.AutoMigrate(&model.Redemption{}); err != nil {
		t.Fatalf("failed to migrate redemption table: %v", err)
	}
}

func seedRedemption(t *testing.T, key string, status int, expiredTime int64) {
	t.Helper()

	redemption := model.Redemption{
		UserId:      1,
		Name:        key,
		Key:         key,
		Status:      status,
		Quota:       100,
		CreatedTime: 1,
		ExpiredTime: expiredTime,
	}
	if err := model.DB.Create(&redemption).Error; err != nil {
		t.Fatalf("failed to create redemption %q: %v", key, err)
	}
}

func TestBatchDisableRedemptionsDisablesOnlyActiveUnusedCodes(t *testing.T) {
	setupRedemptionControllerTestDB(t)
	now := common.GetTimestamp()
	seedRedemption(t, "active-code", common.RedemptionCodeStatusEnabled, 0)
	seedRedemption(t, "disabled-code", common.RedemptionCodeStatusDisabled, 0)
	seedRedemption(t, "used-code", common.RedemptionCodeStatusUsed, 0)
	seedRedemption(t, "expired-code", common.RedemptionCodeStatusEnabled, now-1)

	body := map[string]any{
		"keys": []string{
			" active-code ",
			"disabled-code",
			"used-code",
			"expired-code",
			"missing-code",
			"active-code",
			"",
		},
	}
	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/redemption/batch-disable", body, 1)
	BatchDisableRedemptions(ctx)

	response := decodeAPIResponse(t, recorder)
	if !response.Success {
		t.Fatalf("expected success response, got message: %s", response.Message)
	}

	var result batchDisableRedemptionsResponse
	if err := common.Unmarshal(response.Data, &result); err != nil {
		t.Fatalf("failed to decode batch disable response: %v", err)
	}
	if result.Requested != 5 {
		t.Fatalf("expected 5 normalized keys, got %d", result.Requested)
	}
	if result.Disabled != 1 || result.AlreadyDisabled != 1 || result.Used != 1 || result.Expired != 1 || result.NotFound != 1 {
		t.Fatalf("unexpected batch result: %+v", result)
	}

	var active model.Redemption
	if err := model.DB.First(&active, "key = ?", "active-code").Error; err != nil {
		t.Fatalf("failed to reload active-code: %v", err)
	}
	if active.Status != common.RedemptionCodeStatusDisabled {
		t.Fatalf("expected active-code to be disabled, got status %d", active.Status)
	}

	var used model.Redemption
	if err := model.DB.First(&used, "key = ?", "used-code").Error; err != nil {
		t.Fatalf("failed to reload used-code: %v", err)
	}
	if used.Status != common.RedemptionCodeStatusUsed {
		t.Fatalf("expected used-code to remain used, got status %d", used.Status)
	}
}
