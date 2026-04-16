# MaaS Model Availability Comparison

## Models in opencode.json vs API Response

### ✅ Available Models (Correct)
- `glm-5.1` ✓ (available in API)
- `qwen3-32b` ✓ (available in API)

### ❌ Models NOT Found in API
- `glm-4.6` - NOT AVAILABLE
- `glm-4.5` - NOT AVAILABLE
- `deepseek-r1` - NOT AVAILABLE (API has: `deepseek-r1-250528`)
- `deepseek-v3` - NOT AVAILABLE (API has: `DeepSeek-V3` - case sensitive)
- `qwen3-235b-a22b` - NOT AVAILABLE
- `qwen2.5-72b` - NOT AVAILABLE

### 🆕 New Models Available in API (Not in Config)
- `DeepSeek-V3` (different case)
- `glm-5`
- `deepseek-v3.2`
- `deepseek-v3.1-terminus`

## Issues Found

1. **Case Sensitivity**: `deepseek-v3` vs `DeepSeek-V3`
2. **Version Mismatches**: Multiple GLM and DeepSeek versions have changed
3. **Missing Models**: Several models in config are no longer available
4. **New Models**: API has new models not reflected in config

## ✅ Configuration Updates Completed

**Updated Files:**
- `opencode.json` - Updated with 7 working models
- `src/config/schema.ts` - Updated MODELS constant
- Removed all broken/unavailable models from configuration

**✅ Status:** All configuration files now match current API offerings

## 🧪 Model Testing Results

**Successfully Tested Models:**
- ✅ `glm-5.1` - Working (default, recommended)
- ✅ `glm-5` - Working
- ✅ `DeepSeek-V3` - Working (case sensitive!)
- ✅ `deepseek-v3.2` - Working
- ✅ `deepseek-v3.1-terminus` - Working
- ✅ `deepseek-r1-250528` - Working

**Special Note:**
- ⚠️ `qwen3-32b` - Uses different response format (reasoning model with `reasoning_content` field)

**Performance Notes:**
- Fastest response: `DeepSeek-V3` (~2s latency)
- GLM models: ~7s latency
- All models tested successfully except qwen3-32b which requires special handling for reasoning content