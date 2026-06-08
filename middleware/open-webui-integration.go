package middleware

import (
	"crypto/subtle"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

const openWebUIIntegrationTokenEnv = "NEW_API_OPEN_WEBUI_TOKEN"

func OpenWebUIIntegrationAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !TrustedOpenWebUIIntegrationRequest(c) {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "invalid Open WebUI integration token"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func TrustedOpenWebUIIntegrationRequest(c *gin.Context) bool {
	if c == nil || c.Request == nil || c.Request.URL == nil || !IsOpenWebUIIntegrationPath(c.Request.URL.Path) {
		return false
	}

	expectedToken := strings.TrimSpace(os.Getenv(openWebUIIntegrationTokenEnv))
	if expectedToken == "" {
		return false
	}

	providedToken := bearerToken(c.GetHeader("Authorization"))
	if len(providedToken) != len(expectedToken) {
		return false
	}

	return subtle.ConstantTimeCompare([]byte(providedToken), []byte(expectedToken)) == 1
}

func IsOpenWebUIIntegrationPath(path string) bool {
	path = strings.TrimSpace(path)
	return path == "/api/open-webui" || strings.HasPrefix(path, "/api/open-webui/")
}

func bearerToken(authorization string) string {
	authorization = strings.TrimSpace(authorization)
	if authorization == "" {
		return ""
	}

	prefix := "Bearer "
	if len(authorization) < len(prefix) || !strings.EqualFold(authorization[:len(prefix)], prefix) {
		return ""
	}
	return strings.TrimSpace(authorization[len(prefix):])
}
