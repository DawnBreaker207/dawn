import { Component } from 'react'
import React from 'react'
import clsx from 'clsx'

const Button = ({
  children,
  as: Component = 'button',
  className,
  ...rest
}: {
  children: React.ElementType
  as?: React.ElementType
  [key: string]: any
}) => {
  return (
    <Component
      className={clsx([
        'border border-transparent',
        'dark:bg-primary-600 bg-gray-200 hover:opacity-80',
        '!text-black hover:!text-black dark:!text-white dark:hover:!text-white',
        'focus:shadow-outline-blue focus:outline-none',
        'transition-colors duration-150',
        'text-sm leading-5 font-medium',
        'inline rounded-lg px-4 py-2 shadow',
        'inline-flex items-center gap-1 no-underline',
        className,
      ])}
      {...rest}
    >
      {children}
    </Component>
  )
}

export default Button
