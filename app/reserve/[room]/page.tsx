'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'

type JWT = {
  id: number
  email: string
  classRoom: number
}

type Reservation = {
  id: number
  date: string
  hour: number
  room: number
  user: {
    id: number
    name: string
  }
}

type Notice = {
  id: number
  message: string
  room: number
  createdAt: string
  user: {
    name: string
  }
}

export default function ReservePage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = use(params)
  const roomNumber = parseInt(room)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<JWT | null>(null)
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0];

   const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  function fetchReservations() {
    fetch(`/api/reservation?room=${roomNumber}&date=${today}`)
      .then((res) => res.json())
      .then((data: Reservation[]) => setReservations(data))
  }

  function fetchNotices() {
    fetch(`/api/notice?room=${roomNumber}`)
      .then((res) => res.json())
      .then((data: Notice[]) => setNotices(data))
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('로그인이 필요합니다')
      router.push('/login')
      return
    }

    const decoded = jwtDecode<JWT>(token)
    setUser(decoded)

    // 반이 일치하지 않으면 접근 차단
    if (decoded.classRoom !== roomNumber) {
      alert(`${roomNumber}호는 당신의 반이 아닙니다.`)
      router.push('/posts')
      return
    }

    // 예약 정보 및 공지사항 불러오기
    fetchReservations()
    fetchNotices()
  }, [roomNumber, router])


const handleReserve = async (hour: number) => {
  const token = localStorage.getItem('token')
    const res = await fetch('/api/reservation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ room: roomNumber, hour, date: today }),
  })

    if (res.ok) {
      alert('예약 성공')
      fetchReservations()
    } else {
      const err = await res.json()
      alert(err.error || '예약 실패')
    }
  }

  const handlePostNotice = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/notice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ room: roomNumber, message }),
    })

    if (res.ok) {
      setMessage('')
      fetchNotices()
    } else {
      const err = await res.json()
      alert(err.error || '공지 작성 실패')
    }
  }

  return (
     <div className="p-4 space-y-4">
      <div className="flex justify-between">
        <button
          onClick={() => router.push('/posts')}
          className="bg-gray-200 py-2 px-4 rounded hover:bg-gray-300"
        >
          게시판 홈
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          로그아웃
        </button>
      </div>
      <h1 className="text-xl font-bold">{roomNumber}호 코칭실 예약</h1>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {Array.from({ length: 24 }, (_, i) => {
          const reservation = reservations.find((r) => r.hour === i)
          const myReservation = user
            ? reservations.find((r) => r.user.id === user.id)
            : null
          const isMine = reservation && user && reservation.user.id === user.id
          const disabled = !!reservation || (!!myReservation && !isMine)

          return (
            <button
              key={i}
              onClick={() =>
                reservation
                  ? alert(`예약자: ${reservation.user.name}\n시간: ${i}:00`)
                  : handleReserve(i)
              }
              disabled={disabled}
              className={`p-2 rounded whitespace-pre text-sm ${
                reservation || (myReservation && !isMine)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {reservation ? `${i}:00\n(${reservation.user.name})` : `${i}:00`}
            </button>
          )
        })}
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">공지사항</h2>
        <div className="space-y-2">
          {notices.map((n) => (
            <div key={n.id} className="border p-2 rounded">
              <p className="text-sm">{n.message}</p>
              <p className="text-xs text-gray-500">- {n.user.name}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border rounded px-2 py-1"
            placeholder="내용을 입력하세요"
          />
          <button
            onClick={handlePostNotice}
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
          >
            등록
          </button>
        </div>
      </section>
    </div>
  )
}