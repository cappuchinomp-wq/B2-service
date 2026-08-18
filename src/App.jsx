import React, { act, useEffect, useMemo, useState} from "react";

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
  },

  savePMApproval(payload) {
    return this.request(
      CONFIG.API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
          "text/plain;charset=UTF-8"
        },
        body: JSON.stringify({
          action: "savePMApproval",
          ...payload
        })
      }
    );
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
    const [approvalForm, setApprovalForm] = useState({
      quality: "",
      remark: ""
    });
    const [approvalImages, setApprovalImages] = useState([]);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [selectedIssue, setSelectedIssue] = useState('');
    const [finishJob, setFinishJob] = React.useState(null);
    const [finishImages, setFinishImages] = React.useState([]);
    const [finishForm, setFinishForm] = React.useState({
      workDone: "",
      note: ""
    });
    const [images, setImages] = useState([]);
    const isTech = profile?.role === "TECHNICIAN" ||
    profile?.role === "ADMIN";
    const isAdmin = profile?.role === "ADMIN";
    const isPM = profile?.role === "PM" ||
    profile?.role === "ADMIN";
    const canAccessPM = isPM || isAdmin;

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

    function openFinishWorkPage(job) {
    console.log("OPEN FINISH WORK =", job);
    if (!job) {
      alert("ไม่พบข้อมูลงาน");
      return;
    }
    setFinishJob(job);
    setFinishForm({
      workDone: "",
      note: ""
    });
    setFinishImages([]);
    setCurrentPage("FINISH_WORK");
  }

   async function finishWork(job) {

   if (!job) return;

   setFinishJob(job);
   setFinishForm({
    workDone: "",
    note: ""
   });

   setFinishImages([]);
   setCurrentPage("FINISH_WORK");

  }

  function updateFinishForm(field, value) {
    setFinishForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function handleFinishImageChange(event) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      setFinishImages([]);
      return;
    }
    try {
      const imageList = await Promise.all (
        files.map(file => resizeImage(file))
      );
      setFinishImages(imageList.filter(Boolean));
    }catch (error) {
      console.error("Finish image error:", error);
      alert("ไม่สามารถเตรียมรูปภาพได้");
    }
  }

  async function handleApprovalImageChange(event) {
    const files = Array.form(event.target.files || []);
    if (!files.length) {
      setApprovalImages([]);
      return;
    }
    try {
      const imageList =
      await Promise.all(
        files.map(file => resizeImage(file))
      );
      setApprovalImages(
        imageList.filter(Boolean)
      );
    } catch (error) {
      console.error(
        "Approval image error:",
        error
      );
      alert("ไม่สามารถเตรียมรูปภาพได้");
    }
  }

async function submitFinishWork() {
  if (!finishJob) {
    alert("ไม่พบข้อมูลงาน");
    return;
  }
  if (!finishForm.workDone.trim()) {
    alert("กรุณาระบุงานที่ดำเนินการ");
    return;
  }
  if (!Array.isArray(finishImages) || finishImages.length === 0) {
    alert("กรุณาแนบรูปภาพหลังซ่อมอย่างน้อย 1 รูป");
    return;
  }
  try {
    setLoading(true);

    console.log("===== SEND FINISH WORK =====");
    console.log("WO =", finishJob?.wo);
    console.log("USER =", profile?.userId);
    console.log("WORK DONE =", finishForm?.workDone);
    console.log("NOTE =", finishForm?.note);
    console.log("IMAGES =", finishImages);
    console.log("IMAGE COUNT =", finishImages?.length);
    
    const result = await apiService.finishWork({
      wo: finishJob.wo,
      userId: profile?.userId || "",
      staff: profile?.displayName || "",
      workDone: finishForm.workDone,
      note: finishForm.note,
      images: finishImages
    });
    if (!result.success) {
      throw new Error (
        result.message || "ไม่สามารถปิดงานได้"
      );
    }
    await loadWorkOrders();
    const detail = 
    await apiService.getWorkOrderDetail(finishJob.wo);

    if (detail.success) {
      setSelectedJob(detail.data);
    }
    setFinishJob(null);
    setFinishImages([]);
    setFinishForm({
      workDone: "",
      note: ""
    });

    setCurrentPage("DETAIL");
    alert("ปิดงานเรียบร้อย");
  } catch (err) {
    console.error("submitFinishWork error:", err);
    alert(
      err.message || "ไม่สามารถปิดงานได้"
    );
  } finally {
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

  async function submitPMApproval(result) {

    if (!selectedJob) {
      alert("ไม่พบข้อมูลงาน");
      return;
    }
    if (
      profile?.role !== "PM" &&
      profile?.role !== "ADMIN"
    ) {
      alert("คุณไม่มีสิทธิ์ตรวจรับงาน");
      return;
    }
    if (!approvalForm.quality) {
      alert("กรุณาระบุคุณภาพงานซ่อม");
      return;
    }
    if (result === "ตีกลับ" && 
      !approvalForm.remark.trim()) {
      alert("กรุณาระบุเหตุผลที่ตีกลับ");
      return;
    }
    try {

      setLoading(true);
      console.log("===== PM APPROVAL =====");
      console.log("WO =", selectedJob.wo);
      console.log("USER =", profile?.userId);
      console.log("INSPECTOR =", profile?.displayName);
      console.log("RESULT =", result);
      console.log("QUALITY =", approvalForm.quality);
      console.log("REMARK =", approvalForm.remark);
      console.log("IMAGES =", approvalImages);

      const response = 
      await apiService.savePMApproval({
        wo: selectedJob.wo,
        userId: profile?.userId || "",
        inspector: profile?.displayName || "",
        result: result,
        quality: approvalForm.quality,
        remark: approvalForm.remark,
        images: approvalImages
      });

      if (!response.success) {
        throw new Error(
          response.message ||
          "ไม่สามารถบันทึกผลตรวจรับได้"
        );
      }

      await loadWorkOrders();

      const detail = await apiService.getWorkOrderDetail(
        selectedJob.wo
      );

      if (detail.success) {
        setSelectedJob(detail.data);
      }

      setApprovalForm({
        quality: "",
        remark: ""
      });

      setApprovalImages([]);

      setCurrentPage("PM");

      alert(
        result === "อนุมัติ"
        ? "อนุมัติงานเรียบร้อย"
        : "ตีกลับงานเรียบร้อย"
      );
      
    } catch (error) {
      console.error(
        "submitPMApproval error:",
        error
      );
      alert(
        error.message ||
        "ไม่สามารถบันทึกผลตรวจรับได้"
      );
    } finally {
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

    function openPMPage() {
      if (
        profile?.role !== "PM" &&
        profile?.role !== "ADMIN"
      ) {
        alert("คุณไม่มีสิทธิ์เข้าใช้งาน PM");
        return;
      }
      setCurrentPage("PM");
    }

    function openPMApproval(job) {
      if (!job) {
        alert("ไม่พบข้อมูลงาน");
        return;
      }
      if (
        profile?.role !== "PM" &&
        profile?.role !== "ADMIN"
      ) {
        alert("คุณไม่มีสิทธิ์ตรวจรับงาน");
        return;
      }
      setSelectedJob(job);
      setApprovalForm({
        quality: "",
        remark: ""
      });
      setApprovalImages([]);
      setCurrentPage("PM_APPROVAL");
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
          onPM={() => {
            if (
              profile?.role !== "PM" &&
              profile?.role !== "ADMIN"
            ) {
              alert("คุณไม่มีสิทธิ์เข้าถึง PM");
              return;
            }
            setCurrentPage("PM");
          }}
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
  onRefresh={loadWorkOrders}
  />
)}
{currentPage==="DETAIL" &&(
  <JobDetail
  job={selectedJob}
  isTech={isTech}
  onBack={()=>setCurrentPage("TRACK")}
  onAcceptWork={acceptWork}
  onStartWork={startWork}
  onFinishWork={openFinishWorkPage}
  onSubmitInspection={submitInspection}
  />
)}
{currentPage === "FINISH_WORK" && (
  <FinishWorkPage
  job={finishJob}
  loading={loading}
  finishForm={finishForm}
  finishImages={finishImages}
  onBack={() => {
    setCurrentPage("DETAIL");
  }}
  onChange={updateFinishForm}
  onImageChange={handleFinishImageChange}
  onSubmit={submitFinishWork}/>
)}

{currentPage === "PROFILE" && (
  <ProfilePage 
  profile={profile}
  onLogout={logout}/>
)}

{currentPage === "PM" && (
  (profile?.role === "PM" ||
    profile?.role === "ADMIN")
    ? (
  <PMPage
  jobs={jobs}
  loading={loading}
  onSelect={openPMApproval}
  onRefresh={loadWorkOrders}/>
) : (
  <div className="p-6 text-center">
    <div className="text-5xl mb-3">
      🔒
      </div>
      <div className="font-bold text-gray-700">
        ไม่มีสิทธิ์เข้าถึง
        </div>
        </div>
)
)}

{currentPage === "PM_APPROVAL" && (
  (profile?.role === "PM" ||
    profile?.role === "ADMIN")
    ? (
      <PMApprovalPage
      job={selectedJob}
      loading={loading}
      approvalForm={approvalForm}
      approvalImages={approvalImages}
      onBack={() => {
        setCurrentPage("PM");
      }}
      onChange={(field, value) => {
        setApprovalForm(prev => ({
          ...prev,
          [field]: value
        }));
      }}
      onImageChange={
        handleApprovalImageChange
      }
      onApprove={() =>
        submitPMApproval("อนุมัติ")
      }
      onReject={() =>
        submitPMApproval("ตีกลับ")
      }/>
    )
    : null
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

        function FinishWorkPage({
          job,
          loading,
          finishForm,
          finishImages,
          onBack,
          onChange,
          onImageChange,
          onSubmit
        }) {
          if (!job) {
            return null;
          }

          const safeFinishForm = finishForm || {
            workDone: "",
            note: ""
          };

          const safeFinishImages = Array.isArray(finishImages)
          ? finishImages
          : [];

          return (
            <div className="p-4 pb-24">
              <div className="flex items-center mb-5">
                <button
                type="button"
                onClick={onBack}
                className="text-2xl mr-3"
                  disabled={loading}
                  >
                  ←
                </button>
                <h2 className="text-xl font-bold">
                  ปิดงาน
                </h2>
              </div>
              <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  งานดำเนินการ
                </label>
            <textarea
            rows={5}
            value={safeFinishForm.workDone}
            onChange={(e) =>
              onChange("workDone", e.target.value)
            }
            disabled={loading}
            placeholder="กรอกรายละเอียดงานที่ดำเนินการ"
            className="
            w-full
            border
            rounded-2xl
            p-4
            resize-none
            focus:outline-none
            focus:ring-2
            focus:ring-green-500
            disabled:bg-gray-100"/>
              </div>
              <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  รูปภาพหลังซ่อม
                </label>
                <input
                type="file"
                multiple
                accept="image/*"
                onChange={onImageChange}
                disabled={loading}
                className="
                w-full
                border
                rounded-2xl
                p-3
                disabled:bg-gray-100"/>
                {safeFinishImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {safeFinishImages.map((image, index) => (
                      <div
                      key={index}
                      className="relative">
                        <img
                        src={image.data}
                        alt={`หลังซ่อม ${index + 1}`}
                        className="
                        w-full
                        h-28
                        object-cover
                        rounded-xl
                        border"/>
                        </div>
                    ))}
                    </div>
                ) : (
                  <div className="text-sm text-gray-400 mt-3">
                    ยังไม่ได้แนบรูปภาพ
                    </div>
                )}
              </div>
              <div className="bg-white rounded-3xl p-5 shadow-sm mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  หมายเหตุเพิ่มเติม
                </label>
                <textarea
                rows={4}
                value={safeFinishForm.note}
                onChange={(e) =>
                  onChange("note", e.target.value)
                }
                disabled={loading}
                placeholder="ระบุหมายเหตุเพิ่มเติม"
                className="
                w-full
                border
                rounded-2xl
                p-4
                resize-none
                focus:outline-none
                focus:ring-2
                focus:ring-green-500
                disabled:bg-gray-100"/>
              </div>
              <button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className="
              w-full
              bg-green-600
              hover:bg-green-700
              disabled:bg-gray-400
              text-white
              rounded-2xl
              py-4
              text-lg
              font-bold
              shadow-md">
                {loading
                ? "กำลังบันทึก..."
              : "ยืนยันปิดงาน"
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
          const isPM = role === "PM";
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
          
          if (isPM || isAdmin) {
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
                {menus.map(menu => (
                  <NavButton
                  key={menu.page}
                  active={page === menu.page}
                  icon={menu.icon}
                  label={menu.label}
                  onClick={() => {
                    if (
                      menu.page === "PM" &&
                      role !== "PM" &&
                      role !== "ADMIN"
                    ) {
                      return;
                    }
                     console.log("Navigation:", menu.page);
                    setPage(menu.page);
                  }}/>
                ))}
              </div>
            </div>
          );
        }

        function MyJobPage({
        jobs,
        profile,
        onSelect,
        onAcceptWork,
        onRefresh
        }){
          console.log("Profile =", profile);
          console.log("Jobs =", jobs);

const [tab,setTab] = React.useState("NEW");

        const newJobs = jobs.filter(j =>
        (j.status || "").trim() === "รอดำเนินการ"
        );

        const workingJobs = jobs.filter(j =>
        (j.staff || "").trim().toLowerCase() ===
        (profile.displayName || "").trim().toLowerCase() 
        &&
        [
        "รับงานแล้ว",
        "กำลังดำเนินการ",
        "ปิดงานแล้ว",
        "รอตรวจรับ"
        ].includes((j.status || "").trim())
        );

        const doneJobs = jobs.filter(j =>
        (j.staff || "").trim().toLowerCase() === 
        (profile.displayName || "").trim().toLowerCase()
        &&
        (j.status || "").trim() === "เสร็จสิ้น"
        );

        let filteredJobs = [];

        switch (tab) {
          case "NEW":
            filteredJobs = newJobs;
            break;

            case "WORKING":
              filteredJobs = workingJobs;
              break;

              case "DONE":
                filteredJobs = doneJobs;
                break;

                default:
                  filteredJobs = jobs;
        }

        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-5">
              งานของฉัน
            </h2>
            <button
            onClick={onRefresh}
            className="bg-green-600 text-white px-3 py-2 rounded-full">
              รีเฟรช
            </button>
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

function PMPage({
  jobs,
  loading,
  onSelect,
  onRefresh
}) {
  const [tab, setTab] = React.useState("ALL");
  const pendingJobs = jobs.filter(job =>
    String(job.status || "").trim() === "รอตรวจรับ"
  );
  const urgentJobs = pendingJobs.filter(job => {
    const priority = String(job.priority || "").trim().toLowerCase();

    return (
      priority === "ด่วน" ||
      priority === "urgent" ||
      priority === "hight"
    );
  });
  const filteredJobs =
  tab === "URGENT"
  ? urgentJobs
  : pendingJobs;

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold">
            งานรอตรวจรับ
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            ตรวจสอบงานที่ช่างดำเนินการเสร็จแล้ว
          </p>
        </div>
        <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="
        bg-green-600
        text-white
        px-4
        py-2
        rounded-xl
        text-sm
        font-bold
        disabled:bg-gray-400">
          {loading ? "กำลังโหลด..." : "รีเฟรช"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-gray-500">
            งานรอตรวจรับ
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {pendingJobs.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-gray-500">
            งานด่วน
          </div>
          <div className="text-2xl font-bold text-orange-500 mt-1">
            {urgentJobs.length}
          </div>
        </div>
      </div>
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        <button
        type="button"
        onClick={() => setTab("ALL")}
        className={`
          flex-1
          py-2
          rounded-lg
          text-sm
          ${
            tab === "ALL"
            ? "bg-white shadow text-green-600 font-bold"
            : "text-gray-500"
          }`}>
            ทั้งหมด ({pendingJobs.length})
          </button>
          <button
          type="button"
          onClick={() => setTab("URGENT")}
          className={`
            flex-1
            py-2
            rounded-lg
            text-sm
            ${
              tab === "URGENT"
              ? "bg-white shadow text-orange-500 font-bold"
              : "text-gray-500"
            }`}>
              ด่วน ({urgentJobs.length})
            </button>
      </div>
      {loading && (
        <div className="text-center py-10 text-gray-400">
          กำลังโหลดข้อมูล...
          </div>
      )}
      {!loading && filteredJobs.length === 0 && (
        <div className="
        bg-white
        rounded-3xl
        p-8
        text-center
        shadow-sm">
          <div className="text-5xl mb-3">
            ✓
          </div>
          <div className="font-bold text-gray-700">
            ไม่มีงานรอตรวจรับ
          </div>
          <div className="text-sm text-gray-400 mt-1">
            ขณะนี้ยังไม่มีงานที่รอการตรวจรับ
          </div>
          </div>
      )}
      {!loading && filteredJobs.length > 0 && (
        <div className="space-y-4">
          {filteredJobs.map(job => (
            <div
            key={job.wo}
            className="
            bg-white
            rounded-3xl
            p-4
            shadow-sm
            border
            border-gray-100">
              <div className="flex-justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-lg">
                    {job.wo}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ห้อง {job.room || "-"}
                  </div>
                  <div className="text-sm my-2 line-clamp-2">
                    {job.problem || "-"}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    ช่าง: {job.staff || "-"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-gray-500">
                    {job.finish || ""}
                  </div>
                  <span className="
                  text-xs
                  bg-orange-50
                  text-orange-600
                  border
                  border-orange-200
                  rounded-full
                  px-3
                  py-1
                  whitespace-nowrap">
                    รอตรวจรับ
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <PriorityBadge
                priority={job.priority}/>
              </div>
              <button
              type="button"
              onClick={() => onSelect(job)}
              className="
              w-full
              mt-4
              bg-orange-500
              hover:bg-orange-600
              text-white
              rounded-2xl
              py-3
              font-bold
              transition">
                ตรวจรับงาน
              </button>
              </div>
          ))}
          </div>
      )}
    </div>
  );
}

function PMApprovalPage({
  job,
  loading,
  approvalForm,
  approvalImages,
  onBack,
  onChange,
  onImageChange,
  onApprove,
  onReject
}) {
  if (!job) {
    return (
      <div className="p-4">
        <div className="
        bg-white
        rounded-3xl
        p-8
        text-center
        shadow-sm">
          <div className="text-5xl mb-3">
            📭
          </div>
          <div className="font-bold text-gray-700">
            ไม่พบข้อมูลงาน
          </div>
          <button
          type="button"
          onClick={onBack}
          className="
          mt-5
          bg-green-600
          text-white
          px-5
          py-3
          rounded-xl
          font-bold">
            ← กลับ
          </button>
        </div>
      </div>
    );
  }
  const safeApprovalForm = approvalForm || {
    quality: "",
    remark: ""
  };

  function normalizeImageUrl(value) {
    if (!value) {
      return "";
    }
    if (typeof value === "object") {
      value =
      value.url ||
      value.data ||
      value.src ||
      "";
    }
    const url = String(value).trim();
    if (!url) {
      return "";
    }
     if (url.indexOf(
      "https://drive.google.com/thumbnail"
     ) === 0
    ) {
      return url;
    }
    let match = url.match(
      /drive\.google\.com\/file\/d\/([^/]+)/
    );
    if (match && match[1]) {
      return (
        "https://drive.google.com/thumbnail?id=" +
        encodeURIComponent(match[1]) +
        "&sz=w1200"
      );
    }
    match = url.match(
      /[?&]id=([^&]+)/
    );
    if (match && match[1]) {
      return (
        "https://drive.google.com/thumbnail?id=" +
        encodeURIComponent(match[1]) +
        "&sz=w1200"
      );
    }
    return url;
    }

    function normalizeImageList(value) {
      if (!value) {
        return [];
      }
      let list = [];

      if (Array.isArray(value)) {
        list = value;
      } else {
        list =
        String(value)
        .split(/[\n,]+/)
        .map(item => item.trim())
        .filter(Boolean);
      }
      return list
      .map(item => normalizeImageUrl(item))
      .filter(Boolean);
      }
  
  const beforeImages =
  normalizeImageList(
    job.beforeImages ||
    job.images ||
    ""
  );

  const afterImages =
  normalizeImageList(
   job.afterImages ||
   job.completion?.afterImages ||
   job.completion?.images ||
   job.completion?.finishImages ||
   ""
  );
  const safeApprovalImages =
  Array.isArray(approvalImages)
  ? approvalImages
  : [];

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center mb-5">
        <button
        type="button"
        onClick={onBack}
        className="
        mr-3
        text-2xl">
          ←
        </button>
        <div>
          <h2 className="text-xl font-bold">
            ตรวจรับงาน
          </h2>
          <p className="text-sm text-gray-500">
            PM / Supervisor
          </p>
        </div>
      </div>
      <div className="
      bg-white
      rounded-3xl
      shadow-sm
      p-5
      mb-4">
        <div className="
        flex
        justify-between
        items-start
        mb-4">
          <div>
            <div className="text-xl font-bold">
              {job.wo}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ห้อง {job.room || "-"}
            </div>
          </div>
          <StatusBadge
          status={job.status}/>
        </div>
        <div className="space-y-3 text-sm">
          <div>
           <span className="text-gray-500">
            ประเภทงาน
           </span>
           <div className="font-medium">
            {job.issueType || "-"}
           </div>
          </div>
          <div>
            <span className="text-gray-500">
              ปัญหา
            </span>
            <div className="font-medium">
              {job.problem || "-"}
            </div>
          </div>
          <div>
            <span className="text-gray-500">
              ช่างผู้ดำเนินการ
            </span>
            <div className="font-medium">
              {job.staff || 
              job.completion?.staff ||
              "-"}
            </div>
          </div>
          <div>
            <span className="text-gray-500">
              รายละเอียดแก้ไข
            </span>
            <div className="font-medium whitespace-pre-wrap">
              {job.completion?.solution ||
              job.solution ||
              job.workDone ||
              "-"}
            </div>
          </div>
        </div>
      </div>
      <div className="
      bg-white
      rounded-3xl
      shadow-sm
      p-5
      mb-4">
        <h3 className="font-bold mb-3">
          📷 รูปภาพก่อนซ่อม
        </h3>
        {beforeImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {beforeImages.map(
              (imageUrl, index) => (
                
                <img
                key={index}
                src={imageUrl}
                alt={`ก่อนซ่อม ${index + 1}`}
                loading="lazy"
                className="
                w-full
                h-auto
                max-h-72
                object-contain
                rounded-xl
                border
                bg-gray-50
                cursor-pointer"
                onClick={() => {
                  window.open(
                    imageUrl,
                    "_blank"
                  );
                }}/>
              )
            )}
            </div>

        ) : (
          <div className="
          text-sm
          text-gray-400
          py-4
          text-center">
            ไม่มีรูปภาพก่อนซ่อม
            </div>
               )}
               </div>
            <div className="
            bg-white
            rounded-3xl
            shadow-sm
            p-5
            mb-4">
              <h3 className="font-bold mb-3">
                📸 รูปภาพหลังซ่อม
              </h3>
              {afterImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {afterImages.map(
                  (imageUrl, index) => (
                   
                    <img
                    key={index}
                    src={imageUrl}
                    alt={`หลังซ่อม ${index + 1}`}
                    loading="lazy"
                    className="
                    w-full
                    h-auto
                    max-h-72
                    object-contain
                    rounded-xl
                    border
                    bg-gray-50
                    cursor-pointer"
                    onClick={() => {
                      window.open(
                        imageUrl,
                        "_blank"
                      );
                    }}/>
                  )
                )}
                </div>
              ) : (
                <div className="
                text-sm
                text-gray-400
                py-4
                text-center">
                  ไม่มีรูปภาพหลังซ่อม
                  </div>
              )}
              </div>
              <div className="
              bg-white
              rounded-3xl
              shadow-sm
              p-5
              mb-4">
                <h3 className="font-bold mb-3">
                  คุณภาพงาน
                </h3>
                <div className="grid grid-cols-2 gap-3">
                {[
                  "ดีมาก",
                  "ดี",
                  "พอใช้",
                  "ต้องแก้ไข"
                ].map(option => (
                  <button
                  key={option}
                  type="button"
                  onClick={() =>
                    onChange(
                      "quality",
                      option
                    )
                  }
                  className={`
                    py-3
                    rounded-xl
                    border
                    font-medium
                    ${
                      safeApprovalForm.quality === option
                      ? "bg-green-100 border-green-500 text-green-700"
                      : "bg-white border-gray-200 text-gray-600"
                    }`}>
                      {option}
                    </button>
                ))}
      </div>
    </div>
    <div className="
    bg-white
    rounded-3xl
    shadow-sm
    p-5
    mb-4">
      <h3 className="font-bold mb-3">
        หมายเหตุ
      </h3>
      <textarea
      value={safeApprovalForm.remark}
      onChange={e =>
        onChange(
          "remark",
          e.target.value
        )
      }
      rows={4}
      placeholder="ระบุหมายเหตุเพิ่มเติม"
      className="
      w-full
      border
      border-gray-200
      rounded-xl
      p-3
      resize-none
      focus:outline-none
      focus:ring-2
      focus:ring-green-500"/>
    </div>
    <div className="
    bg-white
    rounded-3xl
    shadow-sm
    p-5
    mb-5">
      <h3 className="font-bold mb-3">
        📸 รูปภาพหลังตรวจรับ
      </h3>
      <input
      type="file"
      accept="image/*"
      multiple
      onChange={onImageChange}
      disabled={loading}
      className="
      w-full
      text-sm"/>
      {safeApprovalImages.length > 0 && (
        <div className="
        grid
        grid-cols-2
        gap-3
        mt-4">
          {safeApprovalImages.map(
            (img, index) => (
              <img
              key={index}
              src={typeof img === "string"
                ? img
                : img?.data || img?.url || ""
              }
              alt={`approval-${index}`}
              className="
              w-full
              h-32
              object-cover
              rounded-xl
              border"/>
            )
          )}
          </div>
      )}
    </div>
    <div className="
    grid
    grid-cols-2
    gap-3">
      <button
      type="button"
      disabled={loading}
      onClick={onReject}
      className="
      py-4
      rounded-2xl
      bg-red-500
      hover:bg-red-600
      text-white
      font-bold
      disabled:bg-gray-400">
        {loading
        ? "กำลังบันทึก..."
      : "↩ ตีกลับ"}
      </button>
      <button
      type="button"
      disabled={loading}
      onClick={onApprove}
      className="
      py-4
      rounded-2xl
      bg-green-600
      hover:bg-green-700
      text-white
      font-bold
      disabled:bg-gray-400">
        {loading
        ? "กำลังบันทึก..."
      : "✓ อนุมัติ"}
      </button>
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
          onPM,
          onSelectJob
        }){
          const latest = React.useMemo(
            () => jobs.slice(0,3),
            [jobs]
          );
          const isAdmin = profile?.role === "ADMIN";
          const isPM = profile?.role === "PM" ||
          profile?.role === "ADMIN";
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
        {isPM && (
          <button
          type="button"
          onClick={onPM}
          className="bg-white rounded-3xl p-6 shadow border border-green-100 hover:shadow-md transition">
            <div className="text-5xl">
              🧑‍💼
            </div>
            <div className="mt-3 font-bold">
              PM ตรวจรับงาน
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ตรวจสอบและอนุมัติงาน
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

function getDisplayImageUrl(url) {
  if (!url) {
    return "";
  }
  let value = String(url).trim();
  if (!value) {
    return "";
  }
  let match = value.match(
    /drive\.google\.com\/file\/d\/([^/]+)/
  );
  if (match && match[1]) {
    return (
      "https://drive.google.com/thumbnail?id=" +
      encodeURIComponent(match[1]) +
      "&sz=w1200"
    );
  }
  match = value.match(
    /[?&]id=([^&]+)/
  );
  if (match && match[1]) {
    return (
      "https://drive.google.com/thumbnail?id=" +
      encodeURIComponent(match[1]) +
      "&sz=w1200"
    );
  }
  return value;
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
              <div className="bg-white rounded-3xl p-5 shadow overflow-hidden">
                <div className="flex justify-between items-center border-b px-5 py-4">
                <div className="text-xl font-bold">
                  {job.wo}
                </div>
                <PriorityBadge priority={job.priority}/>
                </div>
                <div className="flex justify-center py-4">
                <StatusBadge status={job.status}/>
                </div>
               <div className="grid grid-cols-2 gap-y-3 px-5 text-sm">
              <div className="text-gray-500">
                ห้อง
              </div>
              <div className="font-medium text-right">
                {job.room}
              </div>
              <div className="text-gray-500">
                ประเภท
              </div>
              <div className="font-medium text-right">
                {job.issueType}
              </div>
              <div className="text-gray-500">
                อาการ
              </div>
              <div className="font-medium text-right">
                {job.problem}
              </div>
              <div className="text-gray-500">
                แจ้งโดย
                </div>
                <div className="font-medium text-right">
                  {job.displayName}
                </div>
                <div className="text-gray-500">
                เบอร์
                </div>
                <div className="font-medium text-right">
                  {job.phone}
                </div>
                <div className="text-gray-500">
                  เวลาที่แจ้ง
                </div>
                <div className="font-medium text-right">
                  {job.date} {job.time}
                </div>
                </div>
           <div className="px-5 pb-5">
            <div className="font-bold mb-3">
              รูปภาพจากผู้แจ้ง
            </div>
            
              {Array.isArray(job.images) && job.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {job.images.map((img,index) => {
                    const imageUrl =
                    typeof img === "string"
                    ? getDisplayImageUrl(img)
                    : getDisplayImageUrl(
                      img?.url ||
                      img?.data ||
                      ""
                    );
                    if (!imageUrl) {
                      return null;
                    } 
                    return (
              <img
              key = {index}
              src = {img}
              alt = {"image-"+index}
              loading="lazy"
              className="
              w-full
              h-auto
              max-h-96
              object-contain
              rounded-xl
              border
              bg-gray-50
              cursor-pointer"
              onClick={() => {
              window.open(imageUrl, "_blank");
              }}
              onError={(e) => {
                console.error(
                  "Image load failed:",
                  imageUrl
                );
                e.currentTarget.style.display =
                "none";
              }}
              />
            );
        })}
            </div>
            ) : (
              <div className="text-gray-400 text-sm">
                ไม่มีรูปภาพ
              </div>
            )}
            </div>
          {isTech && (
           <div className="px-5 pb-5">
            {
              job.status === "รอดำเนินการ" && (
                <button
                onClick={()=>onAcceptWork(job)}
                className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold">
                  รับงาน
                </button>
              )
            }
            {
              job.status === "รับงานแล้ว" && (
                <button
                onClick={()=>onStartWork(job)}
                className="w-full bg-green-600 text-white rounded-xl py-3 font-semibold">
                  เริ่มงาน
                </button>  
              )           
            }

            {
              job.status === "กำลังดำเนินการ" && (
                <button
                onClick={()=>onFinishWork(job)}
                className="w-full border-2 border-green-600 rounded-xl py-3 text-green-600
                font-semibold">
                  ปิดงาน
                </button>
              )
            }
      
            {
              job.status === "ปิดงานแล้ว" && (
                <button
                onClick={()=>onSubmitInspection(job)}
                className="w-full bg-purple-600 text-white rounded-xl py-3 font-semibold">
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
    
