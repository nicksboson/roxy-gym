import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';

export function mapMemberFromSupabase(row) {
  if (!row) return null;
  return {
    id: row.id,
    uid: row.id, // For backward compatibility with existing UI components
    userId: row.user_id,
    name: row.name || 'Member',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    gender: row.gender || '',
    photoURL: row.photo_url || row.photo || '',
    photo: row.photo_url || row.photo || '',
    planId: row.plan_id || '',
    plan: row.plan_name || 'Membership',
    planName: row.plan_name || 'Membership',
    startDate: row.start_date || '',
    expiryDate: row.expiry_date || '',
    expiry: row.expiry_date || '',
    amount: Number(row.amount || 0),
    paymentStatus: row.payment_status || (row.payment_method === 'Pending' ? 'pending' : 'paid'),
    payment: row.payment_method || (row.payment_status === 'pending' ? 'Pending' : 'UPI'),
    payments: Array.isArray(row.payments) ? row.payments : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role: 'member'
  };
}

export function mapPlanFromSupabase(row) {
  if (!row) return null;
  return {
    id: row.id,
    planName: row.plan_name,
    durationDays: Number(row.duration_days || 30),
    price: Number(row.price || 0)
  };
}

export function mapPaymentFromSupabase(row) {
  if (!row) return null;
  return {
    id: row.id,
    memberId: row.member_id,
    userId: row.user_id,
    planName: row.plan_name,
    amount: Number(row.amount || 0),
    method: row.method || 'UPI',
    status: row.status || 'paid',
    date: row.payment_date || row.created_at?.slice(0, 10),
    createdAt: row.created_at
  };
}

// Bounded query for members with realtime updates
export function useMembers(admin = true, uid = null, limitCount = 100) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      let query = supabase.from('members').select('*');
      if (!admin && uid) {
        query = query.eq('user_id', uid);
      }
      query = query.order('name', { ascending: true }).limit(limitCount);

      const { data: rows, error: err } = await query;
      if (err) {
        setError(err);
        return;
      }

      const list = (rows || []).map(mapMemberFromSupabase);
      setData(list);
      setHasMore(admin && (rows?.length || 0) >= limitCount);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [admin, uid, limitCount]);

  useEffect(() => {
    fetchMembers();

    // Setup Supabase Realtime channel for instant reactivity
    const channel = supabase
      .channel('supabase-members-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMembers]);

  return { data, error, hasMore, refetch: fetchMembers };
}

// Cached plan data to prevent re-fetching on every render
const PLANS_CACHE_KEY = 'roxy_plans_cache';
let memoryPlansCache = null;

try {
  const stored = localStorage.getItem(PLANS_CACHE_KEY);
  if (stored) {
    memoryPlansCache = JSON.parse(stored);
  }
} catch {
  // Ignore storage read errors
}

export function usePlans() {
  const [data, setData] = useState(() => memoryPlansCache || []);
  const [error, setError] = useState(null);

  const fetchPlans = useCallback(async () => {
    try {
      const { data: rows, error: err } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (err) {
        setError(err);
        return;
      }

      const plans = (rows || []).map(mapPlanFromSupabase);
      memoryPlansCache = plans;
      try {
        localStorage.setItem(PLANS_CACHE_KEY, JSON.stringify(plans));
      } catch {
        // Ignore storage write errors
      }
      setData(plans);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    fetchPlans();

    const channel = supabase
      .channel('supabase-plans-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plans' },
        () => {
          fetchPlans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPlans]);

  return { data, error, refetch: fetchPlans };
}

// Query for memberships (falls back to member records)
export function useMemberships(admin = true, uid = null, limitCount = 100) {
  const { data: members, error } = useMembers(admin, uid, limitCount);
  const memberships = members.map(m => ({
    id: m.id,
    userId: m.uid || m.id,
    planId: m.planId,
    plan: m.planName,
    planName: m.planName,
    startDate: m.startDate,
    expiryDate: m.expiryDate,
    status: m.paymentStatus === 'pending' ? 'pending' : 'active'
  }));

  return { data: memberships, error };
}

// Bounded query for payments ledger
export function usePayments(admin = true, uid = null, limitCount = 100) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    try {
      let query = supabase.from('payments').select('*');
      if (!admin && uid) {
        query = query.eq('user_id', uid);
      }
      query = query.order('payment_date', { ascending: false }).limit(limitCount);

      const { data: rows, error: err } = await query;
      if (err) {
        setError(err);
        return;
      }

      setData((rows || []).map(mapPaymentFromSupabase));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [admin, uid, limitCount]);

  useEffect(() => {
    fetchPayments();

    const channel = supabase
      .channel('supabase-payments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayments]);

  return { data, error, refetch: fetchPayments };
}

// Generic collection query helper for backwards compatibility
export function useCollection(tableName) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const { data: rows, error: err } = await supabase.from(tableName).select('*');
        if (!isMounted) return;
        if (err) setError(err);
        else setData(rows || []);
      } catch (e) {
        if (isMounted) setError(e);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [tableName]);

  return { data, error };
}
