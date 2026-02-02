-- Redis Lua script for atomic token bucket rate limiting
-- All operations in this script are atomic

-- ===== INPUTS =====
local bucket_key = KEYS[1]

local now = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local window = tonumber(ARGV[3])
local burst = tonumber(ARGV[4])

local rate_limit = limit + burst
local refill_rate = limit / window

-- ===== LOAD CURRENT STATE =====
local data = redis.call("HMGET", bucket_key, "tokens", "last_refill")

local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

-- ===== INITIALIZE BUCKET (FIRST REQUEST) =====
if tokens == nil or last_refill == nil then
  tokens = rate_limit - 1
  last_refill = now

  redis.call(
    "HMSET",
    bucket_key,
    "tokens", tokens,
    "last_refill", last_refill
  )

  redis.call("EXPIRE", bucket_key, window * 2)

  return {1, tokens, now + window, 0}
end

-- ===== REFILL LOGIC =====
local elapsed = now - last_refill

if elapsed > 0 then
  local refill = math.floor(elapsed * refill_rate)

  if refill > 0 then
    tokens = math.min(rate_limit, tokens + refill)
    last_refill = now
  end
end

-- ===== DECISION =====
if tokens <= 0 then
  local retry_after = math.max(0, window - elapsed)

  return {0, 0, last_refill + window, retry_after}
end

-- ===== CONSUME TOKEN =====
tokens = tokens - 1

-- ===== PERSIST STATE =====
redis.call(
  "HMSET",
  bucket_key,
  "tokens", tokens,
  "last_refill", last_refill
)

redis.call("EXPIRE", bucket_key, window * 2)

-- ===== RETURN RESULT =====
return {1, tokens, last_refill + window, 0}
