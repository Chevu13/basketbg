'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/layout/AuthProvider'
import { createClient } from '@/lib/supabase'
import { MapPin, Type, FileText, Layers, CheckCircle2, ImagePlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import dynamic from 'next/dynamic'
const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false })

const SURFACES = [
  {v:'asfalt',l:'Asfalt',i:'🏙️'},{v:'beton',l:'Beton',i:'🧱'},
  {v:'parket',l:'Parket',i:'🪵'},{v:'guma',l:'Guma',i:'⚫'},{v:'zemlja',l:'Zemlja',i:'🌱'},
]

const inputClass = "w-full bg-[#161618] border border-[rgba(255,255,255,.07)] rounded-xl px-4 py-3 text-white placeholder-[#444] text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"

export default function SuggestCourtPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [name, setName]           = useState('')
  const [address, setAddress]     = useState('')
  const [lat, setLat]             = useState('')
  const [lng, setLng]             = useState('')
  const [surface, setSurface]     = useState('asfalt')
  const [isOutdoor, setIsOutdoor] = useState(true)
  const [description, setDesc]    = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const looksLikeImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name)
    if (!looksLikeImage) { toast.error('Izaberi sliku'); return }
    if (file.size > 8 * 1024 * 1024) { toast.error('Slika je prevelika (max 8MB)'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-5 text-center">
      <p className="text-[#666]">Moraš biti prijavljen da predložiš teren</p>
      <Link href="/auth/login" className="bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl">Prijavi se</Link>
    </div>
  )

  const getGPS = () => {
    if (!navigator.geolocation) { toast.error('Geolokacija nije podržana'); return }
    const id = toast.loading('Tražim lokaciju...')
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); toast.dismiss(id); toast.success('Lokacija pronađena!') },
      ()  => { toast.dismiss(id); toast.error('Greška pri detekciji') }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !address || !lat || !lng) { toast.error('Popuni sva polja'); return }
    if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) { toast.error('Nevalidne koordinate'); return }
    if (!imageFile) { toast.error('Slika terena je obavezna'); return }
    setLoading(true)

    try {
      // 1) Upload slike u Storage
      const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user!.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('court-images')
        .upload(path, imageFile, { cacheControl: '3600' })
      if (uploadErr) throw new Error(`Upload slike: ${uploadErr.message}`)
      const { data: pub } = supabase.storage.from('court-images').getPublicUrl(path)

      // 2) Predlog sa slikom
      const res = await fetch('/api/courts/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, address,
          lat: parseFloat(lat), lng: parseFloat(lng),
          description: description || null,
          is_outdoor: isOutdoor,
          surface,
          image_url: pub.publicUrl,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Greška pri slanju predloga')
      }
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err?.message || 'Greška')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-5 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-400"/>
      </div>
      <h2 className="font-display font-black text-3xl uppercase text-white">Predlog poslat!</h2>
      <p className="text-[#555] text-sm mt-2 max-w-xs">Admin tim će pregledati tvoj predlog i dodati teren ako je validan.</p>
      <button onClick={() => router.push('/courts')}
        className="mt-6 bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl" style={{boxShadow:'0 3px 14px rgba(255,107,0,.3)'}}>
        Nazad na terene
      </button>
    </div>
  )

  return (
    <div className="flex flex-col animate-fade-in">
      <div className="px-5 pt-6 pb-4 border-b border-[#1a1a1a]">
        <h1 className="font-display font-black text-3xl uppercase tracking-tight leading-none">
          Predloži <span className="text-orange-500">teren</span>
        </h1>
        <p className="text-[#555] text-sm mt-1">Znaš teren koji nije na mapi? Dodaj ga!</p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-6">
        <div>
          <Label icon={<Type className="w-4 h-4"/>} text="Naziv terena" required/>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Teren Banjica" required maxLength={100} className={inputClass}/>
        </div>

        <div>
          <Label icon={<MapPin className="w-4 h-4"/>} text="Adresa" required/>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Banjički venac, Voždovac" required className={inputClass}/>
        </div>

        <div>
          <Label icon={<MapPin className="w-4 h-4"/>} text="Lokacija na mapi" required/>
          <LocationPicker
            lat={lat ? parseFloat(lat) : null}
            lng={lng ? parseFloat(lng) : null}
            onChange={(la, ln) => { setLat(la.toString()); setLng(ln.toString()) }}
          />
          <button type="button" onClick={getGPS}
            className="text-xs text-orange-500 flex items-center gap-1.5 hover:text-orange-400 transition-colors mt-2">
            <MapPin className="w-3.5 h-3.5"/> Koristi moju trenutnu lokaciju
          </button>
        </div>

        <div>
          <Label icon={<Layers className="w-4 h-4"/>} text="Tip terena"/>
          <div className="grid grid-cols-2 gap-3">
            {[{v:true,l:'☀️ Otvoreni'},{v:false,l:'🏢 Zatvoreni'}].map(({v,l}) => (
              <button key={String(v)} type="button" onClick={() => setIsOutdoor(v)}
                className={cn('py-3 rounded-xl border text-sm font-medium transition-all',
                  isOutdoor === v ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-[rgba(255,255,255,.07)] text-[#555]')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label icon={<Layers className="w-4 h-4"/>} text="Podloga"/>
          <div className="grid grid-cols-3 gap-2">
            {SURFACES.map(({v,l,i}) => (
              <button key={v} type="button" onClick={() => setSurface(v)}
                className={cn('py-2.5 rounded-xl border text-sm transition-all flex flex-col items-center gap-1',
                  surface === v ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-[rgba(255,255,255,.07)] text-[#555]')}>
                <span>{i}</span><span className="text-xs">{l}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label icon={<ImagePlus className="w-4 h-4"/>} text="Slika terena" required/>
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-[rgba(255,255,255,.07)]">
              <img src={imagePreview} alt="" className="w-full h-44 object-cover" />
              <button type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 rounded-xl border border-dashed border-[rgba(255,255,255,.15)] flex flex-col items-center justify-center gap-2 text-[#555] hover:border-orange-500/50 hover:text-orange-500 transition-colors">
              <ImagePlus className="w-6 h-6" />
              <span className="text-xs">Dodaj fotografiju terena</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        </div>

        <div>
          <Label icon={<FileText className="w-4 h-4"/>} text="Opis (opciono)"/>
          <textarea value={description} onChange={e => setDesc(e.target.value)}
            placeholder="Dva koša, dobro osvetljenje, pored parka..." maxLength={500} rows={3}
            className={inputClass + ' resize-none'}/>
        </div>

        <button type="submit" disabled={loading}
          className="h-12 w-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{boxShadow:'0 3px 14px rgba(255,107,0,.3)'}}>
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Šaljem...</> : 'Pošalji predlog'}
        </button>
      </form>
    </div>
  )
}

function Label({ icon, text, required }: { icon: React.ReactNode; text: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-orange-500">{icon}</span>
      <span className="text-xs text-[#555] uppercase tracking-widest font-semibold">{text}</span>
      {required && <span className="text-orange-500 text-xs">*</span>}
    </div>
  )
}
