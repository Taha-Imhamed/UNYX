'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = React.useRef<React.ElementRef<typeof TabsPrimitive.List> | null>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties | null>(null)

  React.useEffect(() => {
    const list = listRef.current
    if (!list) return

    const updateIndicator = () => {
      const activeTrigger = list.querySelector<HTMLElement>('[data-slot="tabs-trigger"][data-state="active"]')
      if (!activeTrigger) {
        setIndicatorStyle(null)
        return
      }

      setIndicatorStyle({
        width: activeTrigger.offsetWidth,
        height: activeTrigger.offsetHeight,
        transform: `translate(${activeTrigger.offsetLeft}px, ${activeTrigger.offsetTop}px)`,
      })
    }

    updateIndicator()

    const mutationObserver = new MutationObserver(updateIndicator)
    mutationObserver.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'],
    })

    const resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(list)
    Array.from(list.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]')).forEach((trigger) => {
      resizeObserver.observe(trigger)
    })

    window.addEventListener('resize', updateIndicator)

    return () => {
      mutationObserver.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateIndicator)
    }
  }, [])

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      ref={listRef}
      className={cn(
        'bg-muted text-muted-foreground relative inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 top-0 rounded-md bg-background shadow-sm transition-[transform,width,height] duration-250 ease-out',
          indicatorStyle ? 'opacity-100' : 'opacity-0',
        )}
        style={indicatorStyle ?? undefined}
      />
      {props.children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 overflow-hidden text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
