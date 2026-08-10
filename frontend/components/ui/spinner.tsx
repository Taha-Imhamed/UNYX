import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

type SpinnerSize = 'sm' | 'md' | 'lg'

const spinnerSizeClass: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

type SpinnerProps = Omit<React.ComponentProps<'svg'>, 'size'> & {
  size?: SpinnerSize
}

function Spinner({ className, size = 'sm', ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('animate-spin', spinnerSizeClass[size], className)}
      {...props}
    />
  )
}

export { Spinner }
