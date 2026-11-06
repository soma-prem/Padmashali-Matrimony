import { useEffect } from 'react'

/**
 * Sets the browser tab title and the meta description for SEO.
 * Usage (inside any page component):  usePageMeta('Title', 'Description')
 */
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title
      ? `${title} · Padmashali Samaj Matrimony`
      : 'Padmashali Samaj Matrimony'

    let tag = document.querySelector('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.appendChild(tag)
    }
    tag.setAttribute(
      'content',
      description ||
        'A trusted community matrimony platform for the Padmashali samaj — verified profiles, admin-assisted matchmaking.'
    )
  }, [title, description])
}

export default usePageMeta
