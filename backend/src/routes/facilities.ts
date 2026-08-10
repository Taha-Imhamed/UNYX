import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { equipmentRequestsCollection, maintenanceRequestsCollection, roomBookingsCollection } from '../data/collections.js'
import type { EquipmentRequest, MaintenanceRequest, RoomBooking } from '../../../shared/types/index.js'

export const facilitiesRoutes: ReturnType<typeof Router> = Router()

function canAccessFacilities(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor' || role === 'facilities' || role === 'it-admin'
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function toIso(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : new Date().toISOString()
}

async function findRoomBookingConflict(roomName: string, startAt: string, endAt: string, excludeId?: string) {
  const collection = await roomBookingsCollection()
  const candidates = await collection.find({ roomName }).toArray()
  const start = new Date(startAt).getTime()
  const end = new Date(endAt).getTime()
  return candidates.find((booking) => {
    if (excludeId && booking.id === excludeId) return false
    if (booking.status === 'rejected' || booking.status === 'cancelled') return false
    const bookingStart = new Date(booking.startAt).getTime()
    const bookingEnd = new Date(booking.endAt).getTime()
    return start < bookingEnd && end > bookingStart
  })
}

facilitiesRoutes.get('/maintenance-requests', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const collection = await maintenanceRequestsCollection()
    const items = await collection.find().sort({ requestedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Failed to fetch maintenance requests', error)
    res.status(500).json({ success: false, error: 'Failed to fetch maintenance requests' })
  }
})

facilitiesRoutes.post('/maintenance-requests', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const { title, description, category, location, requestedBy, requestedAt, status, priority, assignedTo, completedAt } = req.body ?? {}
    if (!title || !description || !category || !location || !requestedBy) {
      return res.status(400).json({ success: false, error: 'title, description, category, location, and requestedBy are required' })
    }
    const item: MaintenanceRequest = {
      id: buildId('MNT'),
      title: String(title),
      description: String(description),
      category: String(category),
      location: String(location),
      requestedBy: String(requestedBy),
      requestedAt: toIso(requestedAt),
      status: status === 'in-progress' || status === 'on-hold' || status === 'completed' ? status : 'open',
      priority: priority === 'low' || priority === 'high' || priority === 'critical' ? priority : 'medium',
      assignedTo: typeof assignedTo === 'string' ? assignedTo : null,
      completedAt: typeof completedAt === 'string' ? completedAt : null,
    }
    const collection = await maintenanceRequestsCollection()
    await collection.insertOne(item)
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    console.error('Failed to create maintenance request', error)
    res.status(500).json({ success: false, error: 'Failed to create maintenance request' })
  }
})

facilitiesRoutes.put('/maintenance-requests/:id', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const collection = await maintenanceRequestsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Maintenance request not found' })
    }
    const updates: Partial<MaintenanceRequest> = {}
    ;['title', 'description', 'category', 'location', 'requestedBy', 'requestedAt', 'status', 'priority', 'assignedTo', 'completedAt'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    console.error('Failed to update maintenance request', error)
    res.status(500).json({ success: false, error: 'Failed to update maintenance request' })
  }
})

facilitiesRoutes.delete('/maintenance-requests/:id', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const collection = await maintenanceRequestsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Maintenance request not found' })
    }
    res.json({ success: true, message: 'Maintenance request deleted' })
  } catch (error) {
    console.error('Failed to delete maintenance request', error)
    res.status(500).json({ success: false, error: 'Failed to delete maintenance request' })
  }
})

facilitiesRoutes.get('/equipment-requests', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const collection = await equipmentRequestsCollection()
    const items = await collection.find().sort({ requestedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Failed to fetch equipment requests', error)
    res.status(500).json({ success: false, error: 'Failed to fetch equipment requests' })
  }
})

facilitiesRoutes.post('/equipment-requests', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const { itemName, quantity, requestedBy, requestedAt, location, status, notes } = req.body ?? {}
    if (!itemName || !requestedBy || !location) {
      return res.status(400).json({ success: false, error: 'itemName, requestedBy, and location are required' })
    }
    const item: EquipmentRequest = {
      id: buildId('EQU'),
      itemName: String(itemName),
      quantity: Number.isFinite(Number(quantity)) ? Number(quantity) : 1,
      requestedBy: String(requestedBy),
      requestedAt: toIso(requestedAt),
      location: String(location),
      status: status === 'approved' || status === 'rejected' || status === 'fulfilled' ? status : 'pending',
      notes: typeof notes === 'string' ? notes : null,
    }
    const collection = await equipmentRequestsCollection()
    await collection.insertOne(item)
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    console.error('Failed to create equipment request', error)
    res.status(500).json({ success: false, error: 'Failed to create equipment request' })
  }
})

facilitiesRoutes.put('/equipment-requests/:id', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const collection = await equipmentRequestsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Equipment request not found' })
    }
    const updates: Partial<EquipmentRequest> = {}
    ;['itemName', 'quantity', 'requestedBy', 'requestedAt', 'location', 'status', 'notes'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    console.error('Failed to update equipment request', error)
    res.status(500).json({ success: false, error: 'Failed to update equipment request' })
  }
})

facilitiesRoutes.delete('/equipment-requests/:id', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const collection = await equipmentRequestsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Equipment request not found' })
    }
    res.json({ success: true, message: 'Equipment request deleted' })
  } catch (error) {
    console.error('Failed to delete equipment request', error)
    res.status(500).json({ success: false, error: 'Failed to delete equipment request' })
  }
})

facilitiesRoutes.get('/room-bookings', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const collection = await roomBookingsCollection()
    const items = await collection.find().sort({ startAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Failed to fetch room bookings', error)
    res.status(500).json({ success: false, error: 'Failed to fetch room bookings' })
  }
})

facilitiesRoutes.post('/room-bookings', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const { roomName, bookedBy, purpose, startAt, endAt, status, notes } = req.body ?? {}
    if (!roomName || !bookedBy || !purpose || !startAt || !endAt) {
      return res.status(400).json({ success: false, error: 'roomName, bookedBy, purpose, startAt, and endAt are required' })
    }
    const conflict = await findRoomBookingConflict(String(roomName), String(startAt), String(endAt))
    if (conflict) {
      return res.status(409).json({ success: false, error: `${roomName} is already booked for that time (conflicts with "${conflict.purpose}")` })
    }
    const item: RoomBooking = {
      id: buildId('ROM'),
      roomName: String(roomName),
      bookedBy: String(bookedBy),
      purpose: String(purpose),
      startAt: String(startAt),
      endAt: String(endAt),
      status: status === 'approved' || status === 'rejected' || status === 'cancelled' ? status : 'requested',
      notes: typeof notes === 'string' ? notes : null,
    }
    const collection = await roomBookingsCollection()
    await collection.insertOne(item)
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    console.error('Failed to create room booking', error)
    res.status(500).json({ success: false, error: 'Failed to create room booking' })
  }
})

facilitiesRoutes.put('/room-bookings/:id', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const collection = await roomBookingsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Room booking not found' })
    }
    const updates: Partial<RoomBooking> = {}
    ;['roomName', 'bookedBy', 'purpose', 'startAt', 'endAt', 'status', 'notes'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    const mergedRoomName = updates.roomName ?? existing.roomName
    const mergedStartAt = updates.startAt ?? existing.startAt
    const mergedEndAt = updates.endAt ?? existing.endAt
    const mergedStatus = updates.status ?? existing.status
    if (mergedStatus !== 'rejected' && mergedStatus !== 'cancelled') {
      const conflict = await findRoomBookingConflict(String(mergedRoomName), String(mergedStartAt), String(mergedEndAt), existing.id)
      if (conflict) {
        return res.status(409).json({ success: false, error: `${mergedRoomName} is already booked for that time (conflicts with "${conflict.purpose}")` })
      }
    }
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    console.error('Failed to update room booking', error)
    res.status(500).json({ success: false, error: 'Failed to update room booking' })
  }
})

facilitiesRoutes.delete('/room-bookings/:id', async (req, res) => {
  try {
    if (!canAccessFacilities(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Facilities access required' })
    }
    const collection = await roomBookingsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Room booking not found' })
    }
    res.json({ success: true, message: 'Room booking deleted' })
  } catch (error) {
    console.error('Failed to delete room booking', error)
    res.status(500).json({ success: false, error: 'Failed to delete room booking' })
  }
})
