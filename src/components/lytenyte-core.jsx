"use client"

import "@1771technologies/lytenyte-core/grid-full.css"
import { Grid } from "@1771technologies/lytenyte-core"

export function LyteNyteGrid({ columns, rowSource, rowHeight = 40, headerHeight = 40, columnSizeToFit = true, ...props }) {
  return (
    <div className="lng-grid w-full h-full">
      <Grid
        columns={columns}
        rowSource={rowSource}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        columnSizeToFit={columnSizeToFit}
        {...props}
      />
    </div>
  )
}
