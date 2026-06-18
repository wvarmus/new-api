package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestTrustedOpenWebUIIntegrationRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv(openWebUIIntegrationTokenEnv, "shared-secret")

	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/open-webui/sso/verify", nil)
	ctx.Request.Header.Set("Authorization", "Bearer shared-secret")

	if !TrustedOpenWebUIIntegrationRequest(ctx) {
		t.Fatal("expected trusted Open WebUI integration request")
	}
}

func TestTrustedOpenWebUIIntegrationRequestRejectsInvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv(openWebUIIntegrationTokenEnv, "shared-secret")

	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/open-webui/sso/verify", nil)
	ctx.Request.Header.Set("Authorization", "Bearer wrong-secret")

	if TrustedOpenWebUIIntegrationRequest(ctx) {
		t.Fatal("expected invalid token to be rejected")
	}
}

func TestTrustedOpenWebUIIntegrationRequestUsesDefaultToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv(openWebUIIntegrationTokenEnv, "")

	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/open-webui/sso/verify", nil)
	ctx.Request.Header.Set("Authorization", "Bearer "+defaultOpenWebUIIntegrationToken)

	if !TrustedOpenWebUIIntegrationRequest(ctx) {
		t.Fatal("expected default Open WebUI integration token to be trusted")
	}
}

func TestOpenWebUIIntegrationPathMatchesPrefix(t *testing.T) {
	if !IsOpenWebUIIntegrationPath("/api/open-webui/avatar/1") {
		t.Fatal("expected Open WebUI prefix path to match")
	}
	if IsOpenWebUIIntegrationPath("/api/open-webui-other/avatar/1") {
		t.Fatal("expected similar non-prefix path not to match")
	}
}

func TestTrustedOpenWebUIIntegrationRequestRejectsMissingTokenOnPrefixPath(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv(openWebUIIntegrationTokenEnv, "shared-secret")

	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/open-webui/avatar/1", nil)

	if TrustedOpenWebUIIntegrationRequest(ctx) {
		t.Fatal("expected Open WebUI prefix path without token not to be trusted")
	}
}
