<script setup lang="ts">
defineProps<{ size?: number }>()
</script>

<template>
  <div class="logo" :style="{ height: `${size ?? 32}px` }">
    <svg
      :width="size ?? 32"
      :height="size ?? 32"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="15" fill="#16a34a" />
      <path
        d="M16 5 L20 12 L28 13 L22 18 L24 26 L16 22 L8 26 L10 18 L4 13 L12 12 Z"
        fill="white"
      />
    </svg>
    <span class="logo-text">Webase FC</span>
  </div>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 18px;
}
.logo-text {
  letter-spacing: -0.02em;
}
</style>
