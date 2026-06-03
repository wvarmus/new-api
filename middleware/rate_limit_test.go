package middleware

import (
	"net/http"
	"testing"

	"github.com/QuantumNous/new-api/common"
)

func TestTrustedAdminRateLimitMatch(t *testing.T) {
	oldEnabled := common.TrustedAdminApiRateLimitEnable
	t.Cleanup(func() {
		common.TrustedAdminApiRateLimitEnable = oldEnabled
	})
	common.TrustedAdminApiRateLimitEnable = true

	if !trustedAdminRateLimitMatch(http.MethodPost, "/api/channel", "192.168.50.116", "192.168.50.116") {
		t.Fatal("trusted admin channel write should use trusted admin limiter")
	}
	if !trustedAdminRateLimitMatch(http.MethodPut, "/api/option/", "10.0.0.8", "10.0.0.0/24") {
		t.Fatal("trusted admin option write should support CIDR whitelist")
	}
	if !trustedAdminRateLimitMatch(http.MethodPost, "/api/ratio_sync/fetch", "192.168.50.116", "192.168.50.116") {
		t.Fatal("trusted admin ratio sync write should use trusted admin limiter")
	}
	if trustedAdminRateLimitMatch(http.MethodGet, "/api/channel", "192.168.50.116", "192.168.50.116") {
		t.Fatal("GET requests must keep the normal API limiter")
	}
	if trustedAdminRateLimitMatch(http.MethodPost, "/v1/chat/completions", "192.168.50.116", "192.168.50.116") {
		t.Fatal("relay/model requests must not use the trusted admin limiter")
	}
	if trustedAdminRateLimitMatch(http.MethodPost, "/api/channel", "192.168.50.120", "192.168.50.116") {
		t.Fatal("untrusted IP must keep the normal API limiter")
	}
}
