import React, { useEffect, useMemo, useState} from "react";

const CONFIG = {
    LIFF_ID: "2010077744-5kECosJ0",
    API_URL: "https://script.google.com/macros/s/AKfycbzSWSlsKkbMjBixQ-6yZGk9QzPNg4rsaHMBP6epukc4cqiag6RdwwJO_LBtriZLy3akfQ/exec"
};

const apiService = {

  login(username, password) {
    return this.request(CONFIG.API_URL,{
      method: "POST",
      headers: {
        "Content-Type":"text/plain;charset=UTF-8"
      },
      body: JSON.stringify({
        action: "login",
        username,
        password
      })
    });
  },
    async request(url, options = {}) {
      try {
        console.log("Fetch URL =", url);
        console.log(options.body);
        const response = await fetch(url, {
          method: options.method || "GET",
          headers: {
            Accept: "application/json",
            ...(options.headers || {})
          },
          ...options
        });
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }
        console.log(response.type);
        console.log(response.url);
        console.log(response.status);
        return await response.json();
      } catch (error) {
        console.error("API Error:", error);
        throw error;
      }
    },

   getWorkOrders() {
    return this.request(
      `${CONFIG.API_URL}?action=getWorkOrders`
    );
    },

    getWorkOrderDetail(wo) {
      return this.request(
        `${CONFIG.API_URL}?action=getWorkOrderDetail&wo=${encodeURIComponent(wo)}`
      );
    },

   createWorkOrder(payload) {
    return this.request(CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: JSON.stringify(payload)
    });
   },
   acceptWork(payload) {
    return this.request(CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: JSON.stringify({
        action: "acceptWork",
        ...payload
      })
    });
   },
   startWork(payload) {
    return this.request(CONFIG.API_URL,{
      method: "POST",
      headers: {
        "Content-Type":"text/plain;charset=UTF-8"
      },
      body: JSON.stringify({
        action: "startWork",
        ...payload
      })
    });
   },
   finishWork(payload) {
    return this.request(CONFIG.API_URL,{
      method: "POST",
      headers: {
        "Content-Type":"text/plain;charset=UTF-8"
      },
      body: JSON.stringify({
        action: "finishWork",
        ...payload
      })
    });
   },
   submitInspection(payload) {
    return this.request(CONFIG.API_URL,{
      method: "POST",
      headers: {
        "Content-Type":"text/plain;charset=UTF-8"
      },
      body: JSON.stringify({
        action: "submitInspection",
        ...payload
      })
    });
   }
  };

const QUICK_ISSUES = [
    '💡 ไฟฟ้า',  
    '❄️ แอร์',
    '💧 ประปา',
    '🚪 เฟอร์นิเจอร์',
    '🌐 ไอที / อินเตอร์เน็ต',
    '🚨 Fire Alarm',
    '🖌️ งานสี / โครงสร้างอาคาร',
    '🛠️ อื่นๆ'
];

const AREAS = [
  'ห้องพัก',
  'ลอบบี้',
  'ห้องประชุม / จัดเลี้ยง',
  'ห้องน้ำส่วนกลาง',
  'ออฟฟิศ',
  'สโตร์เก็บของ',
  'อื่นๆ'
];

const DEPARTMENT = [
  'พนักงานต้อนรับ (GSA)',
  'แม่บ้าน',
  'ช่างอาคาร',
  'พนักงานรักษาความปลอดภัย',
  'บัญชี',
  'ผู้จัดการโรงแรม (HM)',
  'Owner',
  'อื่นๆ'
];

const PRIORITIES = [
    {
    label: 'Critical - กระทบความปลอดภัย / ห้องขายไม่ได้',
    value: 'Critical - กระทบความปลอดภัย / ห้องขายไม่ได้',
    activeClass: 'bg-red-100 text-red-700'    
    },
    {
      label: 'Hight - กระทบแขกโดยตรง',
      value: 'Hight - กระทบแขกโดยตรง',
      activeClass: 'bg-orange-100 text-orange-700'
    },
    {
        label: 'Medium - ใช้งานได้แต่ไม่สมบูรณ์',
        value: 'Medium - ใช้งานได้แต่ไม่สมบูรณ์',
        activeClass: 'bg-yellow-100 text-yellow-700'
    },
    {
        label: 'Low - งานทั่วไป',
        value: 'Low - งานทั่วไป',
        activeClass: 'bg-green-100 text-green-700'
    }
];

const DEFAULT_FORM = {
    room: "",
    area: "",
    department: "",
    phone: "",
    problem: "",
    priority: "",
    issueType: ""
};

export default function B2Service() {
    const [profile, setProfile] = useState(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [currentPage, setCurrentPage] = useState("HOME");
    const [selectedJob, setSelectedJob] = useState(null);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [selectedIssue, setSelectedIssue] = useState('');
    const [images, setImages] = useState([]);
    const isTech = profile?.role === "TECHNICIAN" ||
    profile?.role === "ADMIN";
    const isAdmin = profile?.role === "ADMIN";

    useEffect(() => {
      checkLogin();
    }, []);

    useEffect(() => {
        console.log("Images =", images);
    }, [images]);

    const kpi = useMemo(() => {
      const pending = jobs.filter(
        job => job.status !== "เสร็จสิ้น"
      ).length;
      const urgent = jobs.filter(
        job => (job.priority || "").includes("Critical")
      ).length;
      const complete =
      jobs.filter(j=>j.status==="เสร็จสิ้น").length;
      const total=jobs.length;

      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin text-5xl">
                ⚙️
              </div>
              <p className="mt-4">
                กำลังโหลด...
              </p>
            </div>
            </div>
        );
      }

      return {
        pending,
        urgent,
        complete,
        total,
        sla: '98%'
      };
        
    }, [jobs]);

    async function checkLogin() {

      const cache = localStorage.getItem("login");
      if (!cache) return;
      const user = JSON.parse(cache);
      setProfile(user);
      setAuthenticated(true);

      await loadWorkOrders();
      
    }

    async function openJobDetail(job){
      try{
        setLoading(true);
        const result = await apiService.getWorkOrderDetail(job.wo);

        if(!result.success){
          throw new Error(result.message);
        }
        setSelectedJob(result.data);
        setCurrentPage("DETAIL");
      }catch(err){
        console.error(err);
        alert(err.message);
      }finally{
        setLoading(false);
      }
    }

    async function loadWorkOrders() {
      
      try {
        const result =
        await apiService.getWorkOrders();
        if (!result.success) {
          throw new Error(result.message);
        }
        setJobs(result.data ?? []);
      } catch (error) {
        console.error(error);
        setJobs([]);
      }
    }

    async function acceptWork(job) {

      try {
        setLoading(true);
        const result =
        await apiService.acceptWork({
          wo: job.wo,
          staff: profile.displayName,
          userId: profile.userId
        });
        if (!result.success){
          throw new Error(result.message);
        }
        await loadWorkOrders();
        const detail =
        await apiService.getWorkOrderDetail(job.wo);
        setSelectedJob(detail.data);
        alert("รับงานเรียบร้อย");
      }catch(err){
        alert(err.message);
      }finally{
        setLoading(false);
      }
      
    }

 async function startWork(job) {

    try {
      setLoading(true);
      const result =
      await apiService.startWork({
        wo: job.wo,
        userId: profile.userId
      });

      if (!result.success){
        throw new Error(result.message);
      }

      await loadWorkOrders();
      const detail = await apiService.getWorkOrderDetail(job.wo);

      setSelectedJob(detail.data);

      alert("เริ่มงานแล้ว");
    }catch(err){
      alert(err.message);
    }finally{
      setLoading(false);
    }
    
  }
  async function finishWork(job) {

    try {
      setLoading(true);
      const result =
      await apiService.finishWork({
        wo: job.wo,
        userId: profile.userId
      });

      if (!result.success){
        throw new Error(result.message);
      }

      await loadWorkOrders();
      const detail =
      await apiService.getWorkOrderDetail(job.wo);
      setSelectedJob(detail.data);
      alert("ปิดงานแล้ว");
    }catch(err){
      alert(err.message);
    }finally{
      setLoading(false);
    }
    
  }
  async function submitInspection(job) {

    try {
      setLoading(true);
      const result =
      await apiService.submitInspection({
        wo: job.wo,
        userId: profile.userId
      });

      if (!result.success){
        throw new Error(result.message);
      }

      await loadWorkOrders();
      const detail =
      await apiService.getWorkOrderDetail(job.wo);

      setSelectedJob(detail.data);
      alert("ส่งตรวจรับเรียบร้อย");
    }catch(err){
      alert(err.message);
    }finally{
      setLoading(false);
    }
    
  }    

    function updateForm(field, value) {
      setForm(prev => ({
        ...prev,
        [field]: value
      }));
    }

    function selectIssue(issue) {
      setSelectedIssue(issue);
      updateForm(
        "issueType",
        issue
      )
    }

    function validateForm() {
      if (!form.room.trim()) {
        alert('กรุณาระบุห้อง');
        return false;
      }

      if (!form.area.trim()) {
        alert('กรุณาระบุพื้นที่ / อาคาร')
        return false;
      }

      if (!form.department.trim()) {
        alert('กรุณาระบุแผนก');
        return false;
      }

      if (!form.phone.trim()) {
        alert('กรุณาระบุเบอร์ติดต่อ');
        return false;
      }

      if (!form.problem.trim()) {
        alert('กรุณาระบุปัญหา');
        return false;
      }

      if (!form.priority) {
        alert("กรุณาเลือกระดับความเร่งด่วน");
        return false;
      }

      if (!selectedIssue) {
        alert("กรุณาเลือกประเภทงาน");
        return false;
      }

      return true;
    }

         
function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image();

    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 800;
      const scale = Math.min(1, maxSize / img.width, maxSize/img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve({
        name: file.name,
        type: "image/jpeg",
        data: canvas.toDataURL("image/jpeg", 0.5)
      });
    };

    reader.readAsDataURL(file);
  });
}

    async function handleImageChange(event) {
      const files = Array.from(event.target.files ?? []);

      if (!files.length) {
        setImages([]);
        return;
      }

      const imageList = (await Promise.all(
        files.map(file => resizeImage(file))
        )
      ).filter(Boolean);
      console.log(imageList);
      setImages(imageList);
     
    }

    async function submitWorkOrder() {

      console.log("STEP 1");

      try {
        if (!validateForm()) {
          console.log("STEP 2");
          return;
        }

        setLoading(true);

        console.log(images.length);
        console.log("STEP 3");

        const payload = {
          action: 'createWorkOrder',
          userId: profile?.userId || '',
          displayName: profile?.displayName || '',
          room: form.room,
          area: form.area,
          department: form.department,
          phone: form.phone,
          issueType: form.issueType,
          problem: form.problem,
          priority: form.priority,
          images: images
        };
        console.log("STEP 4");
        console.log("Payload =", payload);
        console.log("Images =", images);
        console.log("Images JSON =", JSON.stringify(images));
        console.log("Image Count =", payload.images.length);

        console.log("===== SEND =====");
        console.log(payload);
        console.log(JSON.stringify(payload));
        const result = await apiService.createWorkOrder(payload);

        if (!result.success) {
          throw new Error(
            result.message || 'Create Failed'
          );
        }

        alert(`แจ้งซ่อมสำเร็จ\n${result.woCode}`);

        resetForm();

        await loadWorkOrders();

      }catch (error){
        console.error(error);

        alert(error.message || "ไม่สามารถเชื่อมต่อ Server");

      }finally{

        setLoading(false);
      }
    }

    function resetForm() {
      setForm(DEFAULT_FORM);
      setSelectedIssue("");
      setImages([]);
      const fileInput = document.querySelector('input[type="file"]');

      if (fileInput) {
        fileInput.value = "";
      }
    }

    if (!authenticated) {
      return (
        <LoginPage
        onLogin={async (user) => {
          setProfile(user);
          setAuthenticated(true);
          setCurrentPage("HOME");

          localStorage.setItem (
            "login",
            JSON.stringify(user)
          );
          await loadWorkOrders();
        }}/>
      );
    }

    function logout() {
      if (!window.confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
        return;
      }

      localStorage.removeItem("login");

      setProfile(null);
      setAuthenticated(false);
      setJobs([]);
      setSelectedJob(null);
      setCurrentPage("HOME");
    }

    return (
      <div className="min-h-screen bg-gray-100">
      
      <HeaderSection 
      profile={profile} 
      kpi={kpi}/>

      <div className="p-4 pb-24">

        {currentPage === "HOME" && (
          <HomePage
          profile={profile}
          jobs={jobs}
          isTech={isTech}
          onRepair={() => setCurrentPage("REPAIR")}
          onTrack={() => setCurrentPage("TRACK")}
          onMyJob={() => setCurrentPage("MYJOB")}
          onSelectJob={openJobDetail}
          />
        )}

        {currentPage === "REPAIR" && (
          <div className="p-4">
            <RepairForm
            form={form}
            loading={loading}
            selectedIssue={selectedIssue}
            images={images}
            onImageChange={handleImageChange}
            onChange={updateForm}
            onSelectIssue={selectIssue}
            onSubmit={submitWorkOrder}
            />
            </div>
        )}

{currentPage === "TRACK" && (
  <TrackPage
  jobs={jobs}
  onRefresh={loadWorkOrders}
  onSelect={openJobDetail}
  />
)}
{currentPage === "MYJOB" && (
  <MyJobPage
  jobs={jobs}
  profile={profile}
  onSelect={openJobDetail}
  onAcceptWork={acceptWork}
  />
)}
{currentPage==="DETAIL" &&(
  <JobDetail
  job={selectedJob}
  isTech={isTech}
  onBack={()=>setCurrentPage("TRACK")}
  onAcceptWork={acceptWork}
  onStartWork={startWork}
  onFinishWork={finishWork}
  onSubmitInspection={submitInspection}
  />
)}


  {isTech && currentPage === "PM" && (
    <div className="p-4">
      <h2 className="text-xl font-bold">
        Preventive Maintenance
      </h2>
      <p className="text-gray-500 mt-3">
        Coming Soon
      </p>
    </div>
  )}

{currentPage === "PROFILE" && (
  <ProfilePage 
  profile={profile}
  onLogout={logout}/>
)}

</div>
<BottomNavigation
page={currentPage}
setPage={setCurrentPage}
role={profile?.role}
/>
</div>
    );
  }

  function HeaderSection({ profile, kpi}) {
    return (

      <div className='bg-green-600 text-white p-5 rounded-b-3xl shadow-lg'>
      
      <div className='flex justify-between items-center'>
      
      <div>
      
      <h1 className='text-2xl font-bold'>
      Engineering Service
      </h1>

      <p className='text-sm opacity-90 mt-1'>
      ระบบแจ้งซ่อมโรงแรม
      </p>

      {
        profile && (
          <p className='text-xs mt-2'>
          👤 {profile.displayName}
          </p>
        )
      }

      </div>

      <div className='text-5xl'>
      🏨
      </div>
      
      </div>

      <div className='grid grid-cols-3 gap-3 mt-5'>
      <KpiCard title='งานค้าง' value={kpi.pending}/>
      <KpiCard title='งานด่วน' value={kpi.urgent}/>
      <KpiCard title='SLA' value={kpi.sla}/>
      </div>
      </div>
    );
  }

  function KpiCard({title, value}){
    return (
      <div className='bg-white/20 rounded-2xl p-3 text-center'>
     
      <div className='text-xl font-bold'>
      {value}
      </div>

      <div className='text-xs'>
      {title}
      </div>
      </div>      
    );
  }
  
  function RepairForm({
    form,
    loading,
    selectedIssue,
    images,
    onImageChange,
    onChange,
    onSelectIssue,
    onSubmit
  }) {

    return (
      <div className='bg-white rounded-3xl p-5 shadow-sm'>
      
      <div className='flex justify-between items-center mb-4'>
      
      <h2 className='text-lg font-bold'>
      แจ้งซ่อมด่วน
      </h2>

      <span className='text-sm text-green-600'>
      ใช้เวลา &lt; 15 วินาที
      </span>
      </div>

      <div className='mb-4'>
      
      <label className='text-sm font-medium text-gray-600'>
      ห้อง
      </label>

      <input type='text' placeholder='เช่น 508' value={form.room} 
      onChange={(e) => onChange('room', e.target.value)}
      className='w-full mt-2 border rounded-2xl p-4'/>
      </div>

      <div className='mb-4'>
        <label className='text-sm font-medium text-gray-600'>
          พื้นที่ / อาคาร
        </label>

        <select value={form.area} onChange={(e) => onChange('area', e.target.value)}
        className="w-full mt-2 border rounded-2xl p-4 bg-white">
          <option value="">
            เลือกพื้นที่ / อาคาร
          </option>
          {AREAS.map(area => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
        </div>

      <div className='mb-4'>
      
      <label className='text-sm font-medium text-gray-600'>
      ประเภทงาน
      </label>

      <div className='grid grid-cols-2 gap-3 mt-3'>
      
      {
        QUICK_ISSUES.map((issue) => (

        <button key={issue} type='button' 
        onClick={() => onSelectIssue(issue)}
        className={`rounded-2xl py-4 text-sm font-medium transition 
        ${selectedIssue === issue ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>{issue}</button>
        ))
      }  
      </div>
      </div>

      <div className='mb-4'>
        <label className='text-sm font-medium text-gray-600'>
          แผนก
        </label>

        <select value={form.department} onChange={(e) => onChange('department', e.target.value)}
        className="w-full mt-2 border rounded-2xl p-4 bg-white">
          <option value="">
            เลือกแผนก
          </option>
          {DEPARTMENT.map(department => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>

      <div className='mb-4'>
        <label className='text-sm font-medium text-gray-600'>
          เบอร์ติดต่อ
        </label>

        <input type='tel' value={form.phone} onChange={(e) => onChange('phone', e.target.value)}
        className='w-full mt-2 border rounded-2xl p-4' placeholder='เช่น 0812345678'/>
      </div>

      <div className='mb-4'>
      <label className='text-sm font-medium text-gray-600'>
      รายละเอียดอาการเสีย
      </label>

      <textarea rows={4} value={form.problem} 
      onChange={(e) => onChange('problem', e.target.value)}
      className='w-full mt-2 border rounded-2xl p-4'
      placeholder='อธิบายปัญหาเพิ่มเติม'/>
      </div>

      <div className="mb-5">
        <label className="text-sm font-medium text-gray-600">
          แนบรูปภาพ
        </label>

        <input type="file" multiple accept="image/*" onChange={onImageChange} className="w-full mt-2 border rounded-2xl p-3"/>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {images.map((image, index) => (

              <img key={index} src={image.data} alt={image.name} className="rounded-xl h-24 w-full object-cover"/>
              
              ))}

              </div>
        )}
      </div>

      <div className='mb-5'>
      
      <label className='text-sm font-medium text-gray-600'>
      ระดับความเร่งด่วน
      </label>

      <div className='grid grid-cols-3 gap-3 mt-3'>
      
      {
      PRIORITIES.map((priority) => (
        
        <button key={priority.value} type='button' 
        onClick={() => onChange('priority', priority.value)}
        className={`rounded-2xl py-4 font-bold
        ${form.priority === priority.value ? priority.activeClass : 'bg-gray-100'}`}>{priority.label}</button>
        
        ))
      }
      </div>
      </div>

      <button onClick={onSubmit} disabled={loading}
      className='w-full bg-green-600 text-white rounded-2xl py-4 text-lg font-bold shadow-md'>
      {
      loading ? 'กำลังส่ง...' : 'ส่งแจ้งซ่อม'
      }
      </button>
      </div>
        );
        }

        function RecentJobs({jobs}) {
        return (
        <>
        
        <div className='flex justify-between items-center mb-3'>
        
        <h2 className='text-lg font-bold'>
        งานล่าสุด
        </h2>

        <button className='text-sm text-green-600'>
        ดูทั้งหมด
        </button>
        </div>

        <div className='space-y-4'>
        {
        jobs.map((job, index) => (
          <JobCard key={job.wo} job={job}/>
          ))
        }
        </div>
        </>
        );
        }

        function JobCard({job, onClick}) {
        return (
        <div className='bg-white rounded-3xl p-4 shadow-sm'>
        
        <div className='flex justify-between'>
        
        <div>
        
        <div className='font-bold'>
        {job.wo}
        </div>

        <div className='text-sm text-gray-500 mt-1'>
        ห้อง {job.room}
        </div>
        </div>

        <div className='text-xs bg-gray-100 rounded-full px-3 py-1'>
        {job.priority}
        </div>
        </div>

      <div className='mt-3 text-sm'>
        {job.problem}
        </div>
        
        <div className='mt-3 flex justify-between items-center'>
        
        <div className='text-sm text-green-600 font-medium'>
        {job.status}
        </div>

        {onClick && (<button onClick={onClick} className='text-sm bg-green-50 text-green-700 px-3 py-2 rounded-xl'>
        ดูรายละเอียด
        </button>
        )}
        </div>
        </div>
        );
        }

        function BottomNavigation({page, setPage, role}) {

          const isTech = role === "TECHNICIAN";
          const isAdmin = role === "ADMIN";
        
          const menus = [
            {
              page: "HOME",
              icon: "🏠",
              label: "หน้าหลัก"
            },
            {
              page: (isTech || isAdmin)
              ? "MYJOB"
              : "TRACK",
              icon: "📋",
              label: (isTech || isAdmin)
              ? "งานของฉัน"
              : "งาน"
            }
          ];
          
          if (isAdmin) {
            menus.push({
              page: "PM",
              icon: "🛠️",
              label: "PM"
            });
          }

          menus.push({
            page: "PROFILE",
            icon: "👤",
            label: "โปรไฟล์"
          });

          return (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">

              <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${menus.length}, minmax(0,1fr))`
              }}>
                {menus.map(menus => (
                  <NavButton
                  key={menus.page}
                  active={page === menus.page}
                  icon={menus.icon}
                  label={menus.label}
                  onClick={() => {
                    console.log(menus.page)
                    setPage(menus.page)}}/>
                ))}
              </div>
            </div>
          );
        }

        function MyJobPage({
        jobs,
        profile,
        onSelect,
        onAcceptWork
        }){
          console.log("Profile =", profile);
          console.log("Jobs =", jobs);

const [tab,setTab] = React.useState("NEW");

        const myJobs = jobs.filter(job => 
        (job.staff || "").trim().toLowerCase() === (profile.displayName || ""
        ).trim().toLowerCase());

        const filteredJobs = myJobs.filter(job => {
          const status = (job.status || "").trim();
          switch(tab) {
            case "NEW":
              return status === "รอดำเนินการ";

              case "WORKING":
                return [
                  "รับงานแล้ว",
                  "กำลังดำเนินการ",
                  "ปิดงานแล้ว",
                  "รอตรวจรับ"
                ].includes(status);

                case "DONE":
                  return status === "เสร็จสิ้น";

                  default:
                    return true;

                    const newJobs =
                    jobs.filter(j =>
                    (j.status || "").trim() === "รอดำเนินการ"
                    );

                    const workingJobs =
                    myJobs.filter(j =>
                    [
                      "รับงานแล้ว",
                      "กำลังดำเนินการ",
                      "ปิดงานแล้ว",
                      "รอตรวจรับ"
                    ].includes((j.status || "").trim())
                    );

                    const doneJobs =
                    myJobs.filter(j =>
                    (j.status || "").trim() === "เสร็จสิ้น"
                    );

                    switch(tab) {
                      case "NEW":
                        filteredJobs = newJobs;
                        break;

                        case "WORKING":
                          filteredJobs = workingJobs;
                          break;

                          case "DONE":
                            filteredJobs = doneJobs;
                            break;
                    }
          }
        });

        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-5">
              งานของฉัน
            </h2>
            <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
              <button
              onClick={() => setTab("NEW")}
              className={`flex-1 py-2 rounded-lg ${
                tab === "NEW"
                ? "bg-white shadow text-green-600 font-bold"
                : ""
              }`}>
                งานใหม่
                ({jobs.filter(j => (j.status || "").trim() === "รอดำเนินการ").length})
              </button>
              <button
              onClick={() => setTab("WORKING")}
              className={`flex-1 py-2 rounded-lg ${
                tab === "WORKING"
                ? "bg-white shadow text-green-600 font-bold"
                : ""
              }`}>
                กำลังทำ
                ({jobs.filter(j =>
                (j.staff || "").trim().toLowerCase() ===
                (profile.displayName || "").trim().toLowerCase() &&
                  [
                    "รับงานแล้ว",
                    "กำลังดำเนินการ",
                    "ปิดงานแล้ว",
                    "รอตรวจรับ"
                  ].includes((j.status || "").trim())
                ).length})
              </button>
              <button
              onClick={() => setTab("DONE")}
              className={`flex-1 py-2 rounded-lg ${
                tab === "DONE"
                ? "bg-white shadow text-green-600 font-bold"
                : ""
              }`}>
                เสร็จสิ้น
                ({
                  jobs.filter(j =>
                  (j.staff || "").trim().toLowerCase() ===
                  (profile.displayName || "").trim().toLowerCase() &&
                  (j.status || "").trim() === "เสร็จสิ้น"
                  ).length
                })
              </button>
            </div>
          <div className="space-y-4">
            {filteredJobs.map (job => (
              <div
              key={job.wo}
              className="bg-white rounded-2xl shadow p-4">
                <div className="flex justify-between">
                  <div>
                    <div className="font-bold text-lg">
                      {job.wo}
                    </div>
                    <div className="text-gray-500">
                      ห้อง {job.room}
                    </div>
                    <div className="mt-2">
                      {job.problem}
                    </div>
                    <div className="mt-2">
                      <PriorityBadge priority={job.priority}/>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {job.status === "รอดำเนินการ" ? (
                      <button
                      onClick={() => onAcceptWork(job)}
                      className="bg-green-600 text-white rounded-xl px-4 py-2">
                        รับงาน
                      </button>
                    ) : (
                      <button
                      onClick={() => onSelect(job)}
                      className="bg-blue-600 text-white rounded-xl px-4 py-2">
                        รายละเอียด
                      </button>
                    )}
                  </div>
                </div>
                </div>
            ))}
          </div>
          </div>
        );
}

function LoginPage({onLogin}){
  const [username,setUsername] = React.useState("");
  const [password,setPassword] = React.useState("");
  const [loading,setLoading] = React.useState(false);

  async function  submit() {

    try {
      setLoading(true);
      const result = await apiService.login(
        username,
        password
      );

      if (!result.success) {
        alert (result.message);
        return;
      }

      localStorage.setItem (
        "login",
        JSON.stringify(result.data)
      );

      onLogin (result.data);
    }catch(err){
      console.error(err);
      alert(err.message || "Login ไม่สำเร็จ");
    }finally{
      setLoading(false);
    }
    
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-3xl shadow w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Login
        </h2>
        <input
        className="w-full border rounded-xl p-3 mb-4"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}/>
        <input
        type="password"
        className="w-full border rounded-xl p-3 mb-5"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}/>
        <button
        onClick={submit}
        className="w-full bg-green-600 text-white rounded-xl py-3">
          {loading?"กำลังเข้าสู่ระบบ":"Login"}
        </button>
      </div>
    </div>
  );
}
        function HomePage({
          profile,
          jobs,
          isTech,
          onRepair,
          onTrack,
          onMyJob,
          onSelectJob
        }){
          const latest = React.useMemo(
            () => jobs.slice(0,3),
            [jobs]
          );
          const isAdmin = profile?.role === "ADMIN";
          return(
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                onClick={onRepair}
                className="bg-white rounded-3xl p-6 shadow">
                  <div className="text-5xl">
                    🛠
                  </div>
                  <div className="mt-3 font-bold">
                    แจ้งซ่อม
                  </div>
                </button>
                <button
                onClick={onTrack}
                className="bg-white rounded-3xl p-6 shadow">
                  <div className="text-5xl">
                    📋
                  </div>
                  <div className="mt-3 font-bold">
                    ติดตามงาน
                  </div>
                </button>
                {(isTech || isAdmin) && (
                <button
                onClick={onMyJob}
                className="bg-white rounded-3xl p-6 shadow">
                  <div className="text-5xl">
                    👷
                  </div>
                  <div className="mt-3 font-bold">
                  งานของฉัน
                  </div>
                </button>
        )}
                <button
                className="bg-white rounded-3xl p-6 shadow">
                  <div className="text-5xl">
                    📞
                  </div>
                  <div className="mt-3 font-bold">
                    โทรช่าง
                  </div>
                </button>
              </div>
            <div className="mt-6">
              <h2 className="font-bold text-lg">
                งานล่าสุด
              </h2>
              <div className="space-y-3 mt-3">
                {
                  latest.map(job=>(
                    <JobCard
                    key={job.wo}
                    job={job}
                    onClick={()=>
                      onSelectJob(job)
                    }
                    />
                  ))
                }
              </div>
            </div>
            </div>
          )
        }
        function TrackPage({
          jobs,
          onSelect,
          onRefresh
        }){
          const [tab,setTab] = React.useState("ALL");
          const pendingStatus = [
            "รอดำเนินการ",
            "รับงานแล้ว",
            "กำลังดำเนินการ",
            "ปิดงานแล้ว",
            "รอตรวจรับ"
          ];
          const filteredJobs = jobs.filter(job => {
            if (tab === "ALL")
              return true;

            if (tab === "PENDING")
              return pendingStatus.includes((job.status || "").trim());

            if (tab === "DONE")
              return (job.status || "").trim() === "เสร็จสิ้น";

            return true;
          });
          return(
            <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">
                ติดตามงาน
              </h2>
              <button
              onClick={onRefresh}
              className="bg-green-600 text-white px-3 py-1 rounded-full">
                รีเฟรช
              </button>
              </div>
             <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
              <button
              onClick={() => setTab("ALL")}
              className = {`flex-1 py-2 rounded-lg ${
                tab === "ALL"
                ? "bg-white shadow font-bold text-green-600"
                : ""
              }`}>
                ทั้งหมด
              </button>
              <button
              onClick={() => setTab("PENDING")}
              className = {`flex-1 py-2 rounded-lg ${
                tab === "PENDING"
                ? "bg-white shadow font-bold text-green-600"
                : ""
              }`}>
                รอดำเนินการ
              </button>
              <button
              onClick={() => setTab("DONE")}
              className = {`flex-1 py-2 rounded-lg ${
                tab === "DONE"
                ? "bg-white shadow font-bold text-green-600"
                : ""
              }`}>
                เสร็จแล้ว
              </button>
             </div>
              {
                filteredJobs.length===0 ? (
                <div className="bg-white rounded-3xl p-8 text-center">
                  <div className="text-5xl">
                    📭
                  </div>
                  <div className="mt-3 font-bold">
                    ยังไม่มีรายการแจ้งซ่อม
                  </div>
                  </div>
               ) : (
              <div className="space-y-3">
                {
                  filteredJobs.map(job=>(
                    <div
                    key={job.wo}
                    onClick={()=>onSelect(job)}
                    className="bg-white rounded-2xl p-4 shadow cursor-pointer">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-bold text-lg">
                            {job.wo}
                          </div>
                          <div className="text-sm font-medium">
                            ห้อง {job.room}
                          </div>
                          <div className="text-sm text-gray-700 mt-1">
                            {job.problem}
                          </div>
                          <div className="text-sm mt-2">
                            สถานะ :
                              <StatusBadge status={job.status}/>
                          </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {job.time}
                          </div>
                          </div>
                          </div>
                  ))
                }
              </div>
          )
        }
        </div>
          );
        }
        
function StatusBadge({ status }) {
  const colorMap = {
    "รอดำเนินการ": "bg-yellow-100 text-yellow-700",
    "รับงานแล้ว": "bg-indigo-100 text-indigo-700",
    "กำลังดำเนินการ": "bg-blue-100 text-blue-700",
    "ปิดงานแล้ว": "bg-purple-100 text-purple-700",
    "รอตรวจรับ": "bg-orange-100 text-orange-700",
    "เสร็จสิ้น": "bg-green-100 text-green-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
      colorMap[status] || "bg-gray-100 text-gray-700"
    }`}>
      {status}
    </span>
  );
  
}   

function PriorityBadge({ priority }) {
let color = "bg-green-100 text-green-700";

if (priority?.includes("Critical"))
  color = "bg-red-100 text-red-700";

else if (priority?.includes("Hight"))
  color = "bg-orange-100 text-orange-700";

else if (priority?.includes("Medium"))
  color = "bg-yellow-100 text-yellow-700"

return (
  <span
  className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>
    {priority}
  </span>
);
}

        function JobDetail({
          job,
          isTech,
          onBack,
          onAcceptWork,
          onStartWork,
          onFinishWork,
          onSubmitInspection
        }){
          if(!job){
            return null;
          }
          return(
            <div className="p-4">
              <button
              onClick={onBack}
              className="mb-4">
                ← กลับ
              </button>
              <div className="bg-white rounded-3xl p-5 shadow">
                <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {job.wo}
                </h2>
                <StatusBadge status={job.status}/>
                </div>
                <div className="mt-5 space-y-3">
                  <div>
                    <span className="font-semibold">
                  ห้อง :
                  </span>
                  {" "}
                  {job.room}
                </div>
                <div>
              <span className="font-semibold">
                พื้นที่ :
              </span>
              {" "}
              {job.area}
              </div>
              <div>
                <span className="font-semibold">
                  ประเภทงาน :
                </span>
                {" "}
                {job.issueType}
              </div>
              <div>
                <span className="font-semibold">
                  ความเร่งด่วน :
                </span>
                {" "}
                <PriorityBadge priority={job.priority}/>
              </div>
              <div>
                <span className="font-semibold">
                  ผู้แจ้ง :
                </span>
                {" "}
                {job.displayName}
              </div>
              <div>
                <span className="font-semibold">
                  เบอร์ :
                </span>
                {" "}
                {job.phone}
              </div>
              <div>
                <span className="font-semibold">
                  วันที่แจ้ง :
                </span>
                {" "}
                {job.date}
              </div>
                <div>
                  <span className="font-semibold">
                  รายละเอียด
                  </span>
                  <div className="bg-gray-50 rounded-xl p-3 mt-2">
                    {job.problem}
                  </div>
                  </div>
                  </div>

             {
          job.images &&
          job.images.length > 0 && (
            <div className="mt-6">
            <h3 className="font-bold mb-3">
            รูปภาพ
            </h3>
            <div className="grid grid-cols-2 gap-3">
            {
              job.images.map((img,index)=>(
                <img
                key={index}
                src={img}
                alt=""
                loading="lazy"
                className="rounded-2xl shadow"
                />
              ))
            }
               </div>
               </div>
          )}
          {isTech && (
           <div className="mt-6 space-y-3">
            {
              job.status === "รอดำเนินการ" && (
                <button
                onClick={()=>onAcceptWork(job)}
                className="w-full bg-blue-600 text-white rounded-xl py-3">
                  รับงาน
                </button>
              )
            }

            {
              job.status === "รับงานแล้ว" && (
                <button
                onClick={()=>onStartWork(job)}
                className="w-full bg-orange-500 text-white rounded-xl py-3">
                  เริ่มงาน
                </button>
              )
            }

            {
              job.status === "กำลังดำเนินการ" && (
                <button
                onClick={()=>onFinishWork(job)}
                className="w-full bg-green-600 text-white rounded-xl py-3">
                  ปิดงาน
                </button>
              )
            }

            {
              job.status === "ปิดงานแล้ว" && (
                <button
                onClick={()=>onSubmitInspection(job)}
                className="w-full bg-purple-600 text-white rounded-xl py-3">
                  ส่งตรวจรับ
                </button>
              )
            }
            </div>
          )}
         </div>
         </div>
          );
        }

        function ProfilePage({
          profile,
          onLogout
        }){
          return(
            <div className="p-4">
            <div className="bg-white rounded-3xl p-6 shadow">
            <div className="text-6xl">
            👤
            </div>
            <h2 className="mt-4 font-bold">
            {profile?.displayName}
            </h2>
            <p className="text-sm text-gray-500">
            {profile?.userId}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              สิทธิ์: {profile?.role}
            </p>
            <button
            onClick={onLogout}
            className="w-full mt-6 bg-red-600 text-white rounded-xl py-3 font-bold hover:bg-red-700">
              🚪 Logout
            </button>
            </div>
            </div>
          )
        }

        function NavButton({
        icon,
        label,
        active,
        onClick
        }) {
        return (
        
        <button onClick={onClick} 
        className={`flex flex-col items-center justify-center py-3 w-full
        ${active ? "text-green-600" : "text-gray-400"}`}>
        
        <span className='text-2xl'>
        {icon}
        </span>

        <span className='text-xs'>
        {label}
        </span>
        </button>
        );
      }
    
