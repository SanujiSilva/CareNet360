/**
 * @file Tests for GET/PUT/POST in app/api/profile/route.ts
 */
import { GET, PUT, POST } from '@/app/api/profile/route';
import { NextResponse } from 'next/server';

// ---- Mocks for your libs ----
jest.mock('@/lib/mongodb', () => ({
  getDatabase: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}));
jest.mock('@/lib/password', () => ({
  hashPassword: jest.fn(async (p: string) => `hashed:${p}`),
}));
jest.mock('bcryptjs', () => ({
  compare: jest.fn(async () => false),
}));

import { getDatabase } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import * as bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// Helpers
const okAuth = (userId = new ObjectId().toString()) =>
  (verifyAuth as jest.Mock).mockResolvedValue({ userId });
const noAuth = () => (verifyAuth as jest.Mock).mockResolvedValue(null);

// Create a mock DB/collections instance per test
const mkDb = (overrides: Partial<Record<string, any>> = {}) => {
  const users = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };
  const changeLog = {
    insertOne: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  };
  (getDatabase as jest.Mock).mockResolvedValue({
    collection: (name: string) => (name === 'users' ? users : changeLog),
    ...overrides,
  });
  return { users, changeLog };
};

// Build a Request quickly
const req = (method: string, body?: any) =>
  new Request('http://localhost/api/profile', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

describe('API /api/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------- GET --------
  it('GET returns 401 when unauthorized', async () => {
    noAuth();
    const res = await GET(req('GET'));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('GET returns 404 when user not found', async () => {
    okAuth('65f0b4f2c0c9c3b0a1a1a1a1');
    const { users } = mkDb();
    users.findOne.mockResolvedValue(null);
    const res = await GET(req('GET'));
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error).toBe('User not found');
  });

  it('GET returns user without password', async () => {
    okAuth('65f0b4f2c0c9c3b0a1a1a1a1');
    const { users } = mkDb();
    const doc = { _id: new ObjectId(), name: 'Alice', email: 'a@a.com' };
    users.findOne.mockResolvedValue(doc);
    const res = await GET(req('GET'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.user.name).toBe('Alice');
    expect(json.user.password).toBeUndefined();
  });

  // -------- PUT --------
  it('PUT returns 401 when unauthorized', async () => {
    noAuth();
    const res = await PUT(req('PUT', { name: 'Bob' }));
    expect(res.status).toBe(401);
  });

  it('PUT rejects wrong current password', async () => {
    okAuth();
    const { users, changeLog } = mkDb();
    const existing = { _id: new ObjectId(), name: 'Old', password: 'stored' };
    users.findOne.mockResolvedValue(existing);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await PUT(
      req('PUT', { name: 'New', currentPassword: 'bad', newPassword: 'x' })
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('Current password is incorrect');
    expect(changeLog.insertOne).not.toHaveBeenCalled();
  });

  it('PUT updates fields & logs change with correct password', async () => {
    okAuth('65f0b4f2c0c9c3b0a1a1a1a1');
    const { users, changeLog } = mkDb();
  const _id = new ObjectId('65f0b4f2c0c9c3b0a1a1a1a1');
    const existing = {
      _id,
      name: 'Old',
      email: 'old@x.com',
      password: 'stored',
      phone: '123',
    };
    users.findOne
      .mockResolvedValueOnce(existing) // read existing
      .mockResolvedValueOnce({ _id, name: 'New', email: 'old@x.com', phone: '999' }); // after update projection
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (hashPassword as jest.Mock).mockResolvedValue('hashed:new');
    changeLog.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

    const res = await PUT(
      req('PUT', {
        name: 'New',
        phone: '999',
        currentPassword: 'ok',
        newPassword: 'new',
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(users.updateOne).toHaveBeenCalledWith(
      { _id },
      expect.objectContaining({ $set: expect.objectContaining({ name: 'New', phone: '999', password: 'hashed:new' }) })
    );
    expect(changeLog.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.any(ObjectId),
        before: existing,
        changes: expect.any(Object),
      })
    );
    expect(json.user.name).toBe('New');
    expect(json.changeLogId).toBeDefined();
  });

  // -------- POST (undo) --------
  it('POST returns 400 without changeLogId', async () => {
    okAuth();
    mkDb();
    const res = await POST(req('POST', {}));
    const j = await res.json();
    expect(res.status).toBe(400);
    expect(j.error).toBe('Missing changeLogId');
  });

  it('POST returns 404 when change log not found', async () => {
    okAuth('65f0b4f2c0c9c3b0a1a1a1a1');
    const { changeLog } = mkDb();
    changeLog.findOne.mockResolvedValue(null);
    const res = await POST(req('POST', { changeLogId: new ObjectId().toString() }));
    expect(res.status).toBe(404);
  });

  it('POST reverts to snapshot and deletes log', async () => {
    okAuth('65f0b4f2c0c9c3b0a1a1a1a1');
    const { users, changeLog } = mkDb();
    const uid = new ObjectId();
    const changeId = new ObjectId();
    const beforeDoc = { _id: uid, name: 'Old', email: 'e@x.com', phone: '123' };

    changeLog.findOne.mockResolvedValue({ _id: changeId, userId: uid, before: beforeDoc });
    users.findOne.mockResolvedValue({ _id: uid, name: 'Old', email: 'e@x.com', phone: '123' });

    const res = await POST(req('POST', { changeLogId: changeId.toString() }));
    const j = await res.json();

    expect(users.updateOne).toHaveBeenCalledWith(
      { _id: uid },
      { $set: expect.objectContaining({ name: 'Old', email: 'e@x.com', phone: '123' }) }
    );
    expect(changeLog.deleteOne).toHaveBeenCalledWith({ _id: changeId });
    expect(res.status).toBe(200);
    expect(j.user.name).toBe('Old');
  });

  it('GET returns 500 when verifyAuth throws', async () => {
    // Make verifyAuth throw to hit GET catch block
    (verifyAuth as jest.Mock).mockImplementationOnce(() => { throw new Error('boom') })
    const res = await GET(req('GET'))
    const j = await res.json()
    expect(res.status).toBe(500)
    expect(j.error).toBe('Failed to fetch profile')
  })

  it('PUT updates fields without password change', async () => {
    okAuth('65f0b4f2c0c9c3b0a1a1a1a1')
    const { users, changeLog } = mkDb()
    const _id = new ObjectId('65f0b4f2c0c9c3b0a1a1a1a1')
    const existing = {
      _id,
      name: 'Old',
      email: 'old@x.com',
      password: 'stored',
      phone: '123',
    }
    users.findOne
      .mockResolvedValueOnce(existing) // read existing
      .mockResolvedValueOnce({ _id, name: 'New', email: 'old@x.com', phone: '999' }) // after update projection
    changeLog.insertOne.mockResolvedValue({ insertedId: new ObjectId() })

    const res = await PUT(
      req('PUT', {
        name: 'New',
        phone: '999'
      })
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(users.updateOne).toHaveBeenCalledWith(
      { _id },
      expect.objectContaining({ $set: expect.objectContaining({ name: 'New', phone: '999' }) })
    )
    expect(changeLog.insertOne).toHaveBeenCalled()
    expect(json.user.name).toBe('New')
  })

  it('POST returns 400 when change log has no before snapshot', async () => {
    okAuth('65f0b4f2c0c9c3b0a1a1a1a1')
    const { changeLog } = mkDb()
    const changeId = new ObjectId()
    changeLog.findOne.mockResolvedValue({ _id: changeId, userId: new ObjectId(), before: null })
    const res = await POST(req('POST', { changeLogId: changeId.toString() }))
    const j = await res.json()
    expect(res.status).toBe(400)
    expect(j.error).toBe('Invalid change log')
  })

  it('PUT returns 404 when existing user not found', async () => {
    okAuth()
    const { users } = mkDb()
    users.findOne.mockResolvedValue(null)
    const res = await PUT(req('PUT', { name: 'DoesNotExist' }))
    const j = await res.json()
    expect(res.status).toBe(404)
    expect(j.error).toBe('User not found')
  })

  it('POST returns 401 when unauthorized', async () => {
    noAuth()
    const res = await POST(req('POST', { changeLogId: new ObjectId().toString() }))
    const j = await res.json()
    expect(res.status).toBe(401)
    expect(j.error).toBe('Unauthorized')
  })

  it('POST returns 500 when changeLog.findOne throws', async () => {
    okAuth()
    const db = mkDb()
    ;(db.changeLog.findOne as jest.Mock).mockImplementationOnce(() => { throw new Error('boom') })
    const res = await POST(req('POST', { changeLogId: new ObjectId().toString() }))
    const j = await res.json()
    expect(res.status).toBe(500)
    expect(j.error).toBe('Failed to undo profile change')
  })

  it('PUT returns 500 when verifyAuth throws', async () => {
    (verifyAuth as jest.Mock).mockImplementationOnce(() => { throw new Error('boom') })
    const res = await PUT(req('PUT', { name: 'X' }))
    const j = await res.json()
    expect(res.status).toBe(500)
    expect(j.error).toBe('Failed to update profile')
  })

  it('PUT with empty body still updates updatedAt and logs change (covers undefined branches)', async () => {
    const uid = '65f0b4f2c0c9c3b0a1a1a1a1'
    okAuth(uid)
    const { users, changeLog } = mkDb()
    const _id = new ObjectId(uid)
    const existing = {
      _id,
      name: 'Old',
      email: 'old@x.com',
      password: 'stored',
    }
    // first findOne returns existing, second returns after-update projection
    users.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce({ _id, name: 'Old', email: 'old@x.com' })
    changeLog.insertOne.mockResolvedValue({ insertedId: new ObjectId() })

    const res = await PUT(req('PUT', {}))
    const json = await res.json()
    expect(res.status).toBe(200)
    // updateOne should be called with at least the filter and a $set object
    expect(users.updateOne).toHaveBeenCalledWith(
      { _id },
      expect.objectContaining({ $set: expect.any(Object) })
    )
    expect(changeLog.insertOne).toHaveBeenCalled()
    expect(json.changeLogId).toBeDefined()
  })
});
