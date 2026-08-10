import { Router } from 'express'
import {
  coursesCollection,
  enrollmentsCollection,
  professorsCollection,
  siteContentCollection,
  studentsCollection,
} from '../data/collections.js'
import type { SiteContent, SiteMetricKey, SiteStat } from '../../../shared/types/index.js'
import { requireAdmin } from '../middleware/auth.js'

const router: ReturnType<typeof Router> = Router()

const defaultSiteContent: SiteContent = {
  id: 'site-content',
  hero: {
    badge: 'AR University',
    title: 'Build your future',
    subtitle: 'Academic excellence and practical skills',
    primaryCtaLabel: 'Apply now',
    primaryCtaHref: '/interest',
    secondaryCtaLabel: 'Explore programs',
    secondaryCtaHref: '/admissions',
    backgroundImageUrl: null,
  },
  stats: [
    { label: 'Students', value: '0+', metricKey: 'students' },
    { label: 'Courses', value: '0+', metricKey: 'courses' },
    { label: 'Professors', value: '0+', metricKey: 'professors' },
    { label: 'Enrollments', value: '0+', metricKey: 'enrollments' },
  ],
  highlights: [
    { title: 'Career-focused curriculum', description: 'Practical content aligned with market needs' },
    { title: 'Modern learning environment', description: 'Labs and collaborative spaces' },
  ],
  about: {
    badge: 'About',
    title: 'Who we are',
    body: 'A student-centered institution focused on technology and innovation.',
  },
  admissions: {
    badge: 'Admissions',
    title: 'Join us',
    body: 'Submit your application and track status in your student portal.',
  },
  metrics: {
    students: 0,
    courses: 0,
    professors: 0,
    enrollments: 0,
  },
  updatedAt: new Date().toISOString(),
}

function formatMetricValue(value: number, template: string) {
  const hasPlus = template.trim().endsWith('+')
  const hasPercent = template.trim().endsWith('%')
  let formatted = value.toLocaleString()
  if (hasPercent) formatted = `${formatted}%`
  if (hasPlus) formatted = `${formatted}+`
  return formatted
}

function mergeStatsWithMetrics(stats: SiteStat[], metrics: Partial<Record<SiteMetricKey, number>>): SiteStat[] {
  return stats.map((stat) => {
    if (!stat.metricKey) return stat
    const metricValue = metrics[stat.metricKey]
    if (typeof metricValue !== 'number') return stat
    return {
      ...stat,
      value: formatMetricValue(metricValue, stat.value),
    }
  })
}

async function computeMetrics() {
  const [studentsCount, coursesCount, professorsCount, enrollmentsCount] = await Promise.all([
    studentsCollection().then((c) => c.estimatedDocumentCount()),
    coursesCollection().then((c) => c.estimatedDocumentCount()),
    professorsCollection().then((c) => c.estimatedDocumentCount()),
    enrollmentsCollection().then((c) => c.estimatedDocumentCount()),
  ])

  return {
    students: studentsCount,
    courses: coursesCount,
    professors: professorsCount,
    enrollments: enrollmentsCount,
  }
}

router.get('/api/public/site-content', async (_req, res) => {
  try {
    const collection = await siteContentCollection()
    const stored = await collection.findOne({ id: 'site-content' })
    if (!stored) {
      return res.status(404).json({ success: false, error: 'Site content not found' })
    }
    const metrics = await computeMetrics()
    const combinedMetrics = { ...stored.metrics, ...metrics }
    const stats = mergeStatsWithMetrics(stored.stats ?? [], combinedMetrics)
    const response: SiteContent = { ...stored, stats, metrics: combinedMetrics }
    return res.json({ success: true, data: { ...response, updatedAt: response.updatedAt || new Date().toISOString() } })
  } catch (error) {
    console.error('[site-content] failed to load public content', error)
    return res.json({
      success: true,
      data: {
        ...defaultSiteContent,
        updatedAt: new Date().toISOString(),
      },
      message: 'Fallback content served because the database is currently unavailable.',
    })
  }
})

router.put('/api/site-content', requireAdmin, async (req, res) => {
  try {
    const collection = await siteContentCollection()
    const incoming = req.body as Partial<SiteContent>
    if (!incoming.hero?.title || !incoming.hero.subtitle || !incoming.about || !incoming.admissions || !Array.isArray(incoming.stats)) {
      return res.status(400).json({ success: false, error: 'Hero, about, admissions, and stats are required' })
    }
    const next: SiteContent = {
      ...(incoming as SiteContent),
      id: 'site-content',
      updatedAt: new Date().toISOString(),
    }

    await collection.updateOne({ id: 'site-content' }, { $set: next }, { upsert: true })
    return res.json({ success: true, data: next })
  } catch (error) {
    console.error('[site-content] failed to save content', error)
    return res.status(500).json({ success: false, error: 'Unable to save site content' })
  }
})

export { router as siteContentRoutes }
