import process from "node:process"
import { join } from "node:path"
import viteNitro from "vite-plugin-with-nitro"
import { RollopGlob } from "./tools/rollup-glob"
import { projectDir } from "./shared/dir"

const nitroOption: Parameters<typeof viteNitro>[0] = {
  experimental: {
    database: true,
  },
  rollupConfig: {
    plugins: [RollopGlob()],
  },
  sourceMap: false,
  database: {
    default: {
      connector: "sqlite",
    },
  },
  imports: {
    dirs: ["server/utils", "shared"],
  },
  preset: "node-server",
  alias: {
    "@shared": join(projectDir, "shared"),
    "#": join(projectDir, "server"),
  },
}

if (process.env.VERCEL) {
  nitroOption.preset = "vercel-edge"

  // 配置 Vercel KV
  nitroOption.database = {
    default: "vercelKV",
    vercelKV: {
      driver: "vercelKV",
      // Vercel KV 不需要额外的配置，它会自动使用环境变量
    },
  }

  // Vercel 特定配置
  nitroOption.vercel = {
    config: {
      // 配置需要缓存的路由
      cache: [
        {
          source: "/api/(.*)",
          headers: "Cache-Control: max-age=0, s-maxage=300, stale-while-revalidate",
        },
        {
          source: "/(.*)",
          headers: "Cache-Control: max-age=0, s-maxage=300, stale-while-revalidate",
        },
      ],
    },
  }

  // 确保 Vercel KV 所需的环境变量存在
  nitroOption.devServer = {
    env: {
      KV_REST_API_URL: process.env.KV_REST_API_URL || "",
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN || "",
    },
  }
} else if (process.env.CF_PAGES) {
  nitroOption.preset = "cloudflare-pages"
  nitroOption.database = {
    default: {
      connector: "cloudflare-d1",
      options: {
        bindingName: "NEWSNOW_DB",
      },
    },
  }
} else if (process.env.BUN) {
  nitroOption.preset = "bun"
  nitroOption.database = {
    default: {
      connector: "bun-sqlite",
    },
  }
}

export default function () {
  return viteNitro(nitroOption)
}
