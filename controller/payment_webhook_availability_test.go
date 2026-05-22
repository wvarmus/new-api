package controller

import (
	"testing"

	"github.com/QuantumNous/new-api/setting"
	"github.com/stretchr/testify/require"
)

func TestWechatNativeWebhookEnabledRequiresDirectPayConfig(t *testing.T) {
	originalAppID := setting.WechatNativeAppId
	originalMchID := setting.WechatNativeMchId
	originalAPIv3Key := setting.WechatNativeApiV3Key
	originalSerialNo := setting.WechatNativeMerchantSerialNo
	originalPrivateKey := setting.WechatNativeMerchantPrivateKey
	originalPlatformCert := setting.WechatNativePlatformCert
	originalEnabled := setting.DirectPayWechatEnabled
	t.Cleanup(func() {
		setting.WechatNativeAppId = originalAppID
		setting.WechatNativeMchId = originalMchID
		setting.WechatNativeApiV3Key = originalAPIv3Key
		setting.WechatNativeMerchantSerialNo = originalSerialNo
		setting.WechatNativeMerchantPrivateKey = originalPrivateKey
		setting.WechatNativePlatformCert = originalPlatformCert
		setting.DirectPayWechatEnabled = originalEnabled
	})

	setting.DirectPayWechatEnabled = true
	setting.WechatNativeAppId = "wx_app"
	setting.WechatNativeMchId = "mch"
	setting.WechatNativeApiV3Key = "12345678901234567890123456789012"
	setting.WechatNativeMerchantSerialNo = "serial"
	setting.WechatNativeMerchantPrivateKey = "private"
	setting.WechatNativePlatformCert = ""
	require.False(t, isWechatNativeWebhookEnabled())

	setting.WechatNativePlatformCert = "cert"
	require.True(t, isWechatNativeWebhookEnabled())

	setting.DirectPayWechatEnabled = false
	require.False(t, isWechatNativeWebhookEnabled())

	setting.DirectPayWechatEnabled = true
	setting.WechatNativeApiV3Key = ""
	require.False(t, isWechatNativeWebhookEnabled())
}

func TestAlipayWebhookEnabledRequiresDirectPayConfig(t *testing.T) {
	originalAppID := setting.AlipayAppId
	originalPrivateKey := setting.AlipayPrivateKey
	originalPublicKey := setting.AlipayPublicKey
	originalAppCertPublicKey := setting.AlipayAppCertPublicKey
	originalRootCert := setting.AlipayRootCert
	originalPublicCert := setting.AlipayPublicCert
	originalEnabled := setting.DirectPayAlipayEnabled
	t.Cleanup(func() {
		setting.AlipayAppId = originalAppID
		setting.AlipayPrivateKey = originalPrivateKey
		setting.AlipayPublicKey = originalPublicKey
		setting.AlipayAppCertPublicKey = originalAppCertPublicKey
		setting.AlipayRootCert = originalRootCert
		setting.AlipayPublicCert = originalPublicCert
		setting.DirectPayAlipayEnabled = originalEnabled
	})

	setting.DirectPayAlipayEnabled = true
	setting.AlipayAppId = "app_id"
	setting.AlipayPrivateKey = "private"
	setting.AlipayPublicKey = ""
	setting.AlipayAppCertPublicKey = ""
	setting.AlipayRootCert = ""
	setting.AlipayPublicCert = ""
	require.False(t, isAlipayWebhookEnabled())

	setting.AlipayPublicKey = "public"
	require.True(t, isAlipayWebhookEnabled())

	setting.DirectPayAlipayEnabled = false
	require.False(t, isAlipayWebhookEnabled())

	setting.DirectPayAlipayEnabled = true
	setting.AlipayPublicKey = ""
	setting.AlipayAppCertPublicKey = "app_cert"
	setting.AlipayRootCert = "root_cert"
	setting.AlipayPublicCert = ""
	require.False(t, isAlipayWebhookEnabled())

	setting.AlipayPublicCert = "public_cert"
	require.True(t, isAlipayWebhookEnabled())

	setting.AlipayPrivateKey = ""
	require.False(t, isAlipayWebhookEnabled())
}
