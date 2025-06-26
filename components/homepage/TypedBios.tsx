'use client'
import React from 'react'
import { Twemoji } from '../ui'
import Typed from 'typed.js'
const TypedBios = () => {
  const el = React.useRef(null)
  const typed = React.useRef<Typed | null>(null)

  React.useEffect(() => {
    typed.current = new Typed(el.current, {
      stringsElement: '#bios',
      typeSpeed: 40,
      backSpeed: 10,
      loop: true,
      backDelay: 1000,
    })

    return () => typed.current?.destroy()
  }, [])

  return (
    <div>
      <ul id="bios" className="hidden">
        <li>
          I'm aliased as <b className="font-medium">Dawn</b> at work.
        </li>
        <li>
          I live in <b className="font-medium">Ha Noi, Viet Nam</b>.
        </li>
        <li>
          I was born in <b className="font-medium">Ha Noi</b> city.
        </li>
        <li>
          My first programming language I learned was <b className="font-medium">JavaScript</b>.
        </li>
        <li>I love web development.</li>
        {/* <li>
          I'm focusing on building <b className="font-medium">Social Analytics Software</b>.
        </li> */}
        <li>
          I work mostly with <b className="font-medium">Java</b> and{' '}
          <b className="font-medium">Javascript/Typescript</b> technologies.
        </li>
        <li>
          I'm a cat-person <Twemoji emoji="cat" />.
        </li>
        <li>
          I'm a tech-guy. I love
          <span className="ml-1">
            <Twemoji emoji="desktop-computer" />, <Twemoji emoji="keyboard" />
          </span>
          .
        </li>
        <li>
          I love listening <Twemoji emoji="musical-keyboard" /> and Jpop music.
        </li>
        <li>
          I love playing video game <Twemoji emoji="video-game" />, Dota 2, CS2 is my favorite one.
        </li>
      </ul>
      <span ref={el} className="text-neutral-900 dark:text-neutral-200" />
    </div>
  )
}

export default TypedBios
