package model

import "strings"

type ModelDisplayMetadata struct {
	Provider     string
	Icon         string
	ProviderIcon string
}

func GetModelEnableGroups(modelName string) []string {
	// 确保缓存最新
	GetPricing()

	if modelName == "" {
		return make([]string, 0)
	}

	modelEnableGroupsLock.RLock()
	groups, ok := modelEnableGroups[modelName]
	modelEnableGroupsLock.RUnlock()
	if !ok {
		return make([]string, 0)
	}
	return groups
}

// GetModelQuotaTypes 返回指定模型的计费类型集合（来自缓存）
func GetModelQuotaTypes(modelName string) []int {
	GetPricing()

	modelEnableGroupsLock.RLock()
	quota, ok := modelQuotaTypeMap[modelName]
	modelEnableGroupsLock.RUnlock()
	if !ok {
		return []int{}
	}
	return []int{quota}
}

func GetModelVendorNames(modelNames []string) map[string]string {
	metadata := GetModelDisplayMetadata(modelNames)
	result := make(map[string]string, len(metadata))
	for modelName, item := range metadata {
		if item.Provider != "" {
			result[modelName] = item.Provider
		}
	}
	return result
}

func GetModelDisplayMetadata(modelNames []string) map[string]ModelDisplayMetadata {
	if len(modelNames) == 0 {
		return map[string]ModelDisplayMetadata{}
	}

	requested := make(map[string]struct{}, len(modelNames))
	requestedList := make([]string, 0, len(modelNames))
	for _, modelName := range modelNames {
		if modelName != "" {
			if _, ok := requested[modelName]; !ok {
				requested[modelName] = struct{}{}
				requestedList = append(requestedList, modelName)
			}
		}
	}
	if len(requested) == 0 {
		return map[string]ModelDisplayMetadata{}
	}

	var metadata []Model
	if err := DB.Where("status = ?", 1).Order("id ASC").Find(&metadata).Error; err != nil {
		return map[string]ModelDisplayMetadata{}
	}

	var vendors []Vendor
	if err := DB.Find(&vendors).Error; err != nil {
		return map[string]ModelDisplayMetadata{}
	}

	vendorMetadata := make(map[int]ModelDisplayMetadata)
	for _, vendor := range vendors {
		if vendor.Name != "" || vendor.Icon != "" {
			vendorMetadata[vendor.Id] = ModelDisplayMetadata{
				Provider:     vendor.Name,
				Icon:         vendor.Icon,
				ProviderIcon: vendor.Icon,
			}
		}
	}

	type vendorRule struct {
		modelName string
		metadata  ModelDisplayMetadata
	}

	exactRules := make(map[string]ModelDisplayMetadata)
	prefixRules := make([]vendorRule, 0)
	suffixRules := make([]vendorRule, 0)
	containsRules := make([]vendorRule, 0)

	for _, meta := range metadata {
		item := vendorMetadata[meta.VendorID]
		if meta.ModelName == "" {
			continue
		}
		if meta.Icon != "" {
			item.Icon = meta.Icon
		}
		if item.Provider == "" && item.Icon == "" {
			continue
		}

		rule := vendorRule{modelName: meta.ModelName, metadata: item}
		switch meta.NameRule {
		case NameRulePrefix:
			prefixRules = append(prefixRules, rule)
		case NameRuleSuffix:
			suffixRules = append(suffixRules, rule)
		case NameRuleContains:
			containsRules = append(containsRules, rule)
		default:
			exactRules[meta.ModelName] = item
		}
	}

	resolved := make(map[string]ModelDisplayMetadata)

	for _, modelName := range requestedList {
		if item, ok := exactRules[modelName]; ok {
			resolved[modelName] = item
			continue
		}

		for _, rule := range prefixRules {
			if strings.HasPrefix(modelName, rule.modelName) {
				resolved[modelName] = rule.metadata
				break
			}
		}
		if _, ok := resolved[modelName]; ok {
			continue
		}

		for _, rule := range suffixRules {
			if strings.HasSuffix(modelName, rule.modelName) {
				resolved[modelName] = rule.metadata
				break
			}
		}
		if _, ok := resolved[modelName]; ok {
			continue
		}

		for _, rule := range containsRules {
			if strings.Contains(modelName, rule.modelName) {
				resolved[modelName] = rule.metadata
				break
			}
		}
	}

	return resolved
}
