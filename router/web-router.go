package router

import (
	"embed"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func SetWebRouter(router *gin.Engine, buildFS embed.FS, indexPage, performanceMeasurePage []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(func(c *gin.Context) {
		if c.Request.URL.Path == "/debug-ping" && c.Request.Method == "GET" {
			c.Header("Cache-Control", "no-store")
			c.Data(http.StatusOK, "text/plain; charset=utf-8", []byte("ok"))
			c.Abort()
			return
		}
		if c.Request.URL.Path == "/performance-measure" && c.Request.Method == "GET" {
			c.Header("Cache-Control", "no-cache")
			c.Data(http.StatusOK, "text/html; charset=utf-8", performanceMeasurePage)
			c.Abort()
			return
		}
		c.Next()
	})
	router.Use(static.Serve("/", common.EmbedFolder(buildFS, "web/dist")))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
}
