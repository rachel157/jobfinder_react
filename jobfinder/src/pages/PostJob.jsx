import { useState } from 'react'

export default function PostJob(){
  const [form, setForm] = useState({ title:'', company:'', location:'', salary:'', tags:'' })
  const onChange = e => setForm(f => ({...f, [e.target.name]: e.target.value}))
  const onSubmit = e => { e.preventDefault(); alert('Đã nhận tin: '+JSON.stringify(form, null, 2)) }

  return (
    <div className="section">
      <h2>Đăng tin tuyển dụng</h2>
      <form className="card" onSubmit={onSubmit} style={{display:'grid', gap:12}}>
        <label className="field"><span>Tên vị trí</span><input name="title" value={form.title} onChange={onChange} placeholder="VD: Frontend Engineer"/></label>
        <label className="field"><span>Công ty</span><input name="company" value={form.company} onChange={onChange} placeholder="VD: Luma Tech"/></label>
        <label className="field"><span>Địa điểm</span><input name="location" value={form.location} onChange={onChange} placeholder="VD: Hà Nội"/></label>
        <label className="field"><span>Mức lương</span><input name="salary" value={form.salary} onChange={onChange} placeholder="VD: $1500 - $2200"/></label>
        <label className="field"><span>Tags</span><input name="tags" value={form.tags} onChange={onChange} placeholder="VD: React, TypeScript"/></label>
        <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:8}}>
          <button type="reset" className="btn" onClick={()=>setForm({ title:'', company:'', location:'', salary:'', tags:'' })}>Xóa</button>
          <button type="submit" className="btn primary">Đăng tin</button>
        </div>
      </form>
    </div>
  )
}

