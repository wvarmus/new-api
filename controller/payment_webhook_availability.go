package controller

import (
	"strings"

	"github.com/QuantumNous/new-api/setting"
)

func isWechatNativeTopUpEnabled() bool {
	return setting.DirectPayWechatEnabled &&
		strings.TrimSpace(setting.WechatNativeAppId) != "" &&
		strings.TrimSpace(setting.WechatNativeMchId) != "" &&
		strings.TrimSpace(setting.WechatNativeApiV3Key) != "" &&
		strings.TrimSpace(setting.WechatNativeMerchantSerialNo) != "" &&
		strings.TrimSpace(setting.WechatNativeMerchantPrivateKey) != "" &&
		strings.TrimSpace(setting.WechatNativePlatformCert) != ""
}

func isWechatNativeWebhookEnabled() bool {
	return isWechatNativeTopUpEnabled()
}

func isAlipayTopUpEnabled() bool {
	return setting.DirectPayAlipayEnabled &&
		strings.TrimSpace(setting.AlipayAppId) != "" &&
		strings.TrimSpace(setting.AlipayPrivateKey) != "" &&
		isAlipayWebhookConfigured()
}

func isAlipayWebhookConfigured() bool {
	if strings.TrimSpace(setting.AlipayPublicKey) != "" {
		return true
	}
	return strings.TrimSpace(setting.AlipayAppCertPublicKey) != "" &&
		strings.TrimSpace(setting.AlipayRootCert) != "" &&
		strings.TrimSpace(setting.AlipayPublicCert) != ""
}

func isAlipayWebhookEnabled() bool {
	return isAlipayTopUpEnabled()
}
