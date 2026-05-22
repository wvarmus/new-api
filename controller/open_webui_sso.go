package controller

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-gonic/gin"
	"golang.org/x/image/font"
	"golang.org/x/image/font/basicfont"
	"golang.org/x/image/math/fixed"
	"gorm.io/gorm"
)

const openWebUISSOIssuer = "new-api"
const openWebUITokenName = "chat-default"
const defaultOpenWebUISSOTTLSeconds = 60
const openWebUIDefaultTokenGroupDesc = "默认使用用户所在分组"

type openWebUISSOClaims struct {
	Version           int                       `json:"v"`
	Issuer            string                    `json:"iss"`
	Nonce             string                    `json:"nonce"`
	User              openWebUIUser             `json:"user"`
	DirectConnections map[string]any            `json:"direct_connections"`
	Defaults          map[string]any            `json:"defaults"`
	TokenGroup        string                    `json:"token_group"`
	TokenGroups       map[string]openWebUIGroup `json:"token_groups"`
	IssuedAt          int64                     `json:"iat"`
	ExpiresAt         int64                     `json:"exp"`
}

type openWebUIGroup struct {
	Desc  string `json:"desc"`
	Ratio any    `json:"ratio"`
}

type openWebUIUser struct {
	ID          int    `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
	Role        int    `json:"role"`
	Group       string `json:"group"`
	AvatarURL   string `json:"avatar_url,omitempty"`
}

type openWebUISSOGenerateResponse struct {
	Token        string `json:"token"`
	ExpiresAt    int64  `json:"expires_at"`
	TargetOrigin string `json:"target_origin"`
}

type openWebUISSOVerifyRequest struct {
	Token string `json:"token"`
}

type openWebUITokenGroupUser struct {
	ID any `json:"id"`
}

type openWebUITokenGroupRequest struct {
	User              openWebUITokenGroupUser `json:"user"`
	GroupID           *string                 `json:"group_id"`
	TokenGroup        string                  `json:"token_group"`
	DirectConnections map[string]any          `json:"direct_connections"`
}

func openWebUISSOSecret() []byte {
	if secret := strings.TrimSpace(operation_setting.GetGeneralSetting().OpenWebUISSOSecret); secret != "" {
		return []byte(secret)
	}
	if secret := os.Getenv("OPEN_WEBUI_SSO_SECRET"); secret != "" {
		return []byte(secret)
	}
	return []byte(common.CryptoSecret)
}

func openWebUISSOExpiresAt() int64 {
	ttl := operation_setting.GetGeneralSetting().OpenWebUISSOTTLSeconds
	if ttl <= 0 {
		ttl = common.GetEnvOrDefault("OPEN_WEBUI_SSO_TTL_SECONDS", defaultOpenWebUISSOTTLSeconds)
	}
	if ttl <= 0 {
		ttl = defaultOpenWebUISSOTTLSeconds
	}
	return time.Now().Unix() + int64(ttl)
}

func configuredOpenWebUIURL() string {
	return strings.TrimSpace(operation_setting.GetGeneralSetting().OpenWebUIURL)
}

func openWebUIEnabled() bool {
	return configuredOpenWebUIURL() != ""
}

func openWebUITargetOrigin() string {
	generalSetting := operation_setting.GetGeneralSetting()
	openWebUIURL := configuredOpenWebUIURL()
	origin := strings.TrimSpace(generalSetting.OpenWebUIOrigin)
	if origin == "" {
		origin = strings.TrimSpace(os.Getenv("OPEN_WEBUI_ORIGIN"))
	}
	if origin == "" {
		origin = openWebUIURL
	}
	parsedURL, err := url.Parse(origin)
	if err == nil && parsedURL.Scheme != "" && parsedURL.Host != "" {
		return strings.TrimRight(parsedURL.Scheme+"://"+parsedURL.Host, "/")
	}
	return strings.TrimRight(origin, "/")
}

func requestBaseURL(c *gin.Context) string {
	if baseURL := strings.TrimRight(strings.TrimSpace(system_setting.ServerAddress), "/"); baseURL != "" {
		return baseURL
	}
	if baseURL := strings.TrimRight(os.Getenv("OPEN_WEBUI_NEW_API_BASE_URL"), "/"); baseURL != "" {
		return baseURL
	}

	scheme := c.GetHeader("X-Forwarded-Proto")
	if scheme == "" {
		if c.Request.TLS != nil {
			scheme = "https"
		} else {
			scheme = "http"
		}
	}

	host := c.GetHeader("X-Forwarded-Host")
	if host == "" {
		host = c.Request.Host
	}

	return strings.TrimRight(fmt.Sprintf("%s://%s", scheme, host), "/")
}

func signOpenWebUISSOClaims(claims openWebUISSOClaims) (string, error) {
	payload, err := common.Marshal(claims)
	if err != nil {
		return "", err
	}

	encodedPayload := base64.RawURLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, openWebUISSOSecret())
	mac.Write([]byte(encodedPayload))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return encodedPayload + "." + signature, nil
}

func verifyOpenWebUISSOToken(token string) (*openWebUISSOClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return nil, errors.New("invalid token format")
	}

	mac := hmac.New(sha256.New, openWebUISSOSecret())
	mac.Write([]byte(parts[0]))
	expectedSignature := mac.Sum(nil)
	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("invalid token signature")
	}
	if !hmac.Equal(signature, expectedSignature) {
		return nil, errors.New("invalid token signature")
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, errors.New("invalid token payload")
	}

	claims := openWebUISSOClaims{}
	if err := common.Unmarshal(payload, &claims); err != nil {
		return nil, errors.New("invalid token payload")
	}
	if claims.Issuer != openWebUISSOIssuer || claims.User.ID <= 0 {
		return nil, errors.New("invalid token claims")
	}
	if claims.ExpiresAt <= time.Now().Unix() {
		return nil, errors.New("token expired")
	}

	return &claims, nil
}

func effectiveOpenWebUITokenGroup(user *model.User, token *model.Token) string {
	group := strings.TrimSpace(token.Group)
	if group != "" {
		return group
	}
	return strings.TrimSpace(user.Group)
}

func openWebUITokenGroupsForUser(user *model.User, currentGroup string) map[string]openWebUIGroup {
	effectiveGroup := currentGroup
	if effectiveGroup == "" {
		effectiveGroup = strings.TrimSpace(user.Group)
	}
	usableGroups := service.GetUserUsableGroups(user.Group)
	if _, ok := usableGroups["auto"]; !ok && (currentGroup == "auto" || setting.DefaultUseAutoGroup) && len(service.GetUserAutoGroup(user.Group)) > 0 {
		usableGroups["auto"] = setting.GetUsableGroupDescription("auto")
	}
	if effectiveGroup != "" {
		if _, ok := usableGroups[effectiveGroup]; !ok {
			usableGroups[effectiveGroup] = setting.GetUsableGroupDescription(effectiveGroup)
		}
	}
	groups := make(map[string]openWebUIGroup, len(usableGroups)+1)
	groups[""] = openWebUIGroup{
		Desc:  openWebUIDefaultTokenGroupDesc,
		Ratio: service.GetUserGroupRatio(user.Group, user.Group),
	}

	groupRatios := ratio_setting.GetGroupRatioCopy()
	for groupID, desc := range usableGroups {
		if groupID == "auto" {
			groups[groupID] = openWebUIGroup{
				Desc:  setting.GetUsableGroupDescription("auto"),
				Ratio: "自动",
			}
			continue
		}

		if _, ok := groupRatios[groupID]; !ok && groupID != effectiveGroup {
			continue
		}

		groups[groupID] = openWebUIGroup{
			Desc:  desc,
			Ratio: service.GetUserGroupRatio(user.Group, groupID),
		}
	}
	return groups
}

func configuredOpenWebUITokenGroupForUser(user *model.User) (string, error) {
	group := strings.TrimSpace(operation_setting.GetGeneralSetting().OpenWebUITokenGroup)
	if group == "" {
		return "", nil
	}

	if group == "auto" {
		if len(service.GetUserAutoGroup(user.Group)) == 0 {
			return "", fmt.Errorf("Open WebUI token group auto is not available for user group %s", user.Group)
		}
		return group, nil
	}

	if !service.GroupInUserUsableGroups(user.Group, group) {
		return "", fmt.Errorf("Open WebUI token group %s is not allowed for user group %s", group, user.Group)
	}
	if !ratio_setting.ContainsGroupRatio(group) {
		return "", fmt.Errorf("Open WebUI token group %s is deprecated", group)
	}

	return group, nil
}

func ensureOpenWebUIToken(user *model.User) (*model.Token, string, error) {
	var token model.Token
	err := model.DB.Where("user_id = ? AND name = ? AND status = ?", user.Id, openWebUITokenName, common.TokenStatusEnabled).
		Order("id desc").First(&token).Error
	if err == nil {
		return &token, "sk-" + token.GetFullKey(), nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, "", err
	}

	key, err := common.GenerateKey()
	if err != nil {
		return nil, "", err
	}

	tokenGroup, err := configuredOpenWebUITokenGroupForUser(user)
	if err != nil {
		return nil, "", err
	}

	token = model.Token{
		UserId:             user.Id,
		Name:               openWebUITokenName,
		Key:                key,
		CreatedTime:        common.GetTimestamp(),
		AccessedTime:       common.GetTimestamp(),
		ExpiredTime:        -1,
		UnlimitedQuota:     true,
		ModelLimitsEnabled: false,
		Group:              tokenGroup,
	}
	if err := token.Insert(); err != nil {
		return nil, "", err
	}

	return &token, "sk-" + token.GetFullKey(), nil
}

func generateOpenWebUIAvatarPNG(user *model.User) ([]byte, error) {
	seed := strings.TrimSpace(user.Username)
	if seed == "" {
		seed = strings.TrimSpace(user.DisplayName)
	}
	if seed == "" {
		seed = "U"
	}

	colors := []color.RGBA{
		{R: 245, G: 158, B: 11, A: 255}, {R: 59, G: 130, B: 246, A: 255}, {R: 6, G: 182, B: 212, A: 255},
		{R: 34, G: 197, B: 94, A: 255}, {R: 107, G: 114, B: 128, A: 255}, {R: 99, G: 102, B: 241, A: 255},
		{R: 14, G: 165, B: 233, A: 255}, {R: 132, G: 204, B: 22, A: 255}, {R: 249, G: 115, B: 22, A: 255},
		{R: 236, G: 72, B: 153, A: 255}, {R: 168, G: 85, B: 247, A: 255}, {R: 239, G: 68, B: 68, A: 255},
		{R: 20, G: 184, B: 166, A: 255}, {R: 139, G: 92, B: 246, A: 255}, {R: 234, G: 179, B: 8, A: 255},
	}
	sum := 0
	for _, r := range seed {
		sum += int(r)
	}

	runes := []rune(seed)
	initialRune := runes[0]
	if initialRune > unicode.MaxASCII {
		initialRune = '?'
	}
	initial := strings.ToUpper(string(initialRune))
	background := colors[sum%len(colors)]
	img := image.NewRGBA(image.Rect(0, 0, 128, 128))
	draw.Draw(img, img.Bounds(), &image.Uniform{C: background}, image.Point{}, draw.Src)

	face := basicfont.Face7x13
	metrics := face.Metrics()
	textWidth := font.MeasureString(face, initial).Round()
	textHeight := metrics.Height.Round()
	scale := 5
	textImg := image.NewRGBA(image.Rect(0, 0, textWidth, textHeight))
	drawer := font.Drawer{
		Dst:  textImg,
		Src:  image.White,
		Face: face,
		Dot:  fixed.P(0, metrics.Ascent.Round()),
	}
	drawer.DrawString(initial)

	offsetX := (img.Bounds().Dx() - textWidth*scale) / 2
	offsetY := (img.Bounds().Dy() - textHeight*scale) / 2
	for y := 0; y < textHeight*scale; y++ {
		for x := 0; x < textWidth*scale; x++ {
			_, _, _, a := textImg.At(x/scale, y/scale).RGBA()
			if a > 0 {
				img.Set(offsetX+x, offsetY+y, color.White)
			}
		}
	}

	buf := bytes.Buffer{}
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func openWebUIAvatarURL(c *gin.Context, user *model.User) string {
	return fmt.Sprintf("%s/api/open-webui/avatar/%d", requestBaseURL(c), user.Id)
}

func extractOpenWebUIAPIKey(directConnections map[string]any) string {
	keysValue, ok := directConnections["OPENAI_API_KEYS"]
	if !ok {
		return ""
	}

	switch keys := keysValue.(type) {
	case []any:
		if len(keys) > 0 {
			return strings.TrimPrefix(strings.TrimSpace(fmt.Sprint(keys[0])), "sk-")
		}
	case []string:
		if len(keys) > 0 {
			return strings.TrimPrefix(strings.TrimSpace(keys[0]), "sk-")
		}
	case string:
		return strings.TrimPrefix(strings.TrimSpace(keys), "sk-")
	}

	return ""
}

func parseOpenWebUIRequestUserID(value any) int {
	switch v := value.(type) {
	case int:
		return v
	case int64:
		return int(v)
	case float64:
		return int(v)
	case string:
		id, _ := strconv.Atoi(strings.TrimSpace(v))
		return id
	default:
		return 0
	}
}

func getOpenWebUIUserAndToken(c *gin.Context, req openWebUITokenGroupRequest) (*model.User, *model.Token, bool) {
	userID := parseOpenWebUIRequestUserID(req.User.ID)
	if userID <= 0 {
		common.ApiErrorMsg(c, "invalid user")
		return nil, nil, false
	}

	user, err := model.GetUserById(userID, false)
	if err != nil {
		common.ApiError(c, err)
		return nil, nil, false
	}
	if user.Status != common.UserStatusEnabled {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "user is disabled"})
		return nil, nil, false
	}

	apiKey := extractOpenWebUIAPIKey(req.DirectConnections)
	if apiKey == "" {
		common.ApiErrorMsg(c, "missing Open WebUI token")
		return nil, nil, false
	}

	token, err := model.GetTokenByKey(apiKey, true)
	if err != nil || token == nil || token.UserId != user.Id || token.Name != openWebUITokenName || token.Status != common.TokenStatusEnabled {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "invalid Open WebUI token"})
		return nil, nil, false
	}

	return user, token, true
}

func buildOpenWebUITokenGroupResponse(user *model.User, token *model.Token) gin.H {
	tokenGroup := strings.TrimSpace(token.Group)
	return gin.H{
		"token_group":           tokenGroup,
		"effective_token_group": effectiveOpenWebUITokenGroup(user, token),
		"token_groups":          openWebUITokenGroupsForUser(user, tokenGroup),
	}
}

func openWebUITokenGroupAllowed(user *model.User, groupID string) bool {
	if groupID == "" {
		return true
	}
	if groupID == "auto" {
		return len(service.GetUserAutoGroup(user.Group)) > 0
	}
	return service.GroupInUserUsableGroups(user.Group, groupID)
}

func buildOpenWebUISSOClaims(c *gin.Context, user *model.User, token *model.Token, apiKey string) openWebUISSOClaims {
	apiBaseURL := requestBaseURL(c) + "/v1"
	now := time.Now().Unix()
	directConnections := map[string]any{
		"OPENAI_API_BASE_URLS": []string{apiBaseURL},
		"OPENAI_API_KEYS":      []string{apiKey},
		"OPENAI_API_CONFIGS": map[string]any{
			"0": map[string]any{"enable": true},
		},
	}
	tokenGroup := strings.TrimSpace(token.Group)
	tokenGroups := openWebUITokenGroupsForUser(user, tokenGroup)

	return openWebUISSOClaims{
		Version: 1,
		Issuer:  openWebUISSOIssuer,
		Nonce:   common.GetUUID(),
		User: openWebUIUser{
			ID:          user.Id,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			Email:       user.Email,
			Role:        user.Role,
			Group:       user.Group,
			AvatarURL:   openWebUIAvatarURL(c, user),
		},
		DirectConnections: directConnections,
		TokenGroup:        tokenGroup,
		TokenGroups:       tokenGroups,
		Defaults: map[string]any{
			"version":             1,
			"locale":              "zh-CN",
			"directConnections":   directConnections,
			"newApiTokenGroup":    tokenGroup,
			"newApiTokenGroups":   tokenGroups,
			"newApiDefaultsToken": common.GetUUID(),
		},
		IssuedAt:  now,
		ExpiresAt: openWebUISSOExpiresAt(),
	}
}

func GetOpenWebUIAvatar(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("user_id"))
	if err != nil || userID <= 0 {
		c.Status(http.StatusNotFound)
		return
	}

	user := model.User{Id: userID}
	if err := model.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.Status(http.StatusNotFound)
		return
	}

	avatar, err := generateOpenWebUIAvatarPNG(&user)
	if err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}

	c.Header("Cache-Control", "no-store")
	c.Data(http.StatusOK, "image/png", avatar)
}

func GenerateOpenWebUISSOToken(c *gin.Context) {
	if !openWebUIEnabled() {
		common.ApiErrorMsg(c, "Open WebUI 对话功能未启用")
		return
	}

	userID := c.GetInt("id")
	user, err := model.GetUserById(userID, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if user.Status != common.UserStatusEnabled {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "user is disabled"})
		return
	}

	openWebUIToken, apiKey, err := ensureOpenWebUIToken(user)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	claims := buildOpenWebUISSOClaims(c, user, openWebUIToken, apiKey)
	token, err := signOpenWebUISSOClaims(claims)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	common.ApiSuccess(c, openWebUISSOGenerateResponse{
		Token:        token,
		ExpiresAt:    claims.ExpiresAt,
		TargetOrigin: openWebUITargetOrigin(),
	})
}

func GetOpenWebUITokenGroups(c *gin.Context) {
	req := openWebUITokenGroupRequest{}
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "invalid params")
		return
	}

	user, token, ok := getOpenWebUIUserAndToken(c, req)
	if !ok {
		return
	}

	common.ApiSuccess(c, buildOpenWebUITokenGroupResponse(user, token))
}

func SwitchOpenWebUITokenGroup(c *gin.Context) {
	req := openWebUITokenGroupRequest{}
	if err := common.DecodeJson(c.Request.Body, &req); err != nil || req.GroupID == nil {
		common.ApiErrorMsg(c, "invalid params")
		return
	}

	user, token, ok := getOpenWebUIUserAndToken(c, req)
	if !ok {
		return
	}

	groupID := strings.TrimSpace(*req.GroupID)
	if !openWebUITokenGroupAllowed(user, groupID) {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "token group is not allowed"})
		return
	}

	token.Group = groupID
	if err := token.Update(); err != nil {
		common.ApiError(c, err)
		return
	}

	common.ApiSuccess(c, buildOpenWebUITokenGroupResponse(user, token))
}

func VerifyOpenWebUISSOToken(c *gin.Context) {
	if !openWebUIEnabled() {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Open WebUI integration is disabled"})
		return
	}

	req := openWebUISSOVerifyRequest{}
	if err := common.DecodeJson(c.Request.Body, &req); err != nil || strings.TrimSpace(req.Token) == "" {
		common.ApiErrorMsg(c, "invalid params")
		return
	}

	claims, err := verifyOpenWebUISSOToken(req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": err.Error()})
		return
	}

	common.ApiSuccess(c, claims)
}
