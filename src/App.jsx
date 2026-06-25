import React, { useEffect, useMemo, useState} from "react";
import liff from '@line/liff';

const CONFIG = {
    LIFF_ID: '2010077744-5kECosJ0',
    API_URL: 'https://script.google.com/macros/s/AKfycbzSWSlsKkbMjBixQ-6yZGk9QzPNg4rsaHMBP6epukc4cqiag6RdwwJO_LBtriZLy3akfQ/exec'
};

const apiservice = {
    async request(url, options = {}) {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
    },

    async getWorkOrders() {
    return this.request(
      `${CONFIG.API_URL}?action=getWorkOrders`
    );
    },

    async createWorkOrder(payload) {
      const formData = new URLSearchParams();

      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value ?? '');
      });

      const response = await fetch(
        CONFIG.API_URL,
        {
          method: 'POST',
          body: formData
        }
      );
      return response.json();
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

const PRIORITIES = [
    {
    label: 'ด่วน',
    value: 'ด่วน',
    activeClass: 'bg-red-100 text-red-700'    
    },
    {
        label: 'ปานกลาง',
        value: 'ปานกลาง',
        activeClass: 'bg-yellow-100 text-yellow-700'
    },
    {
        label: 'ปกติ',
        value: 'ปกติ',
        activeClass: 'bg-green-100 text-green-700'
    }
];

const DEFAULT_FORM = {
    room: '',
    department: '',
    phone: '',
    problem: '',
    remark: '',
    priority: 'ปกติ'
};

export default function B2Service() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [selectedIssue, setSelectedIssue] = useState('');

    useEffect(() => {
        initializeLIFF();
    }, []);

    const kpi = useMemo(() => {
      const pending = jobs.filter(
        job => job.priority !== 'เสร็จสิ้น'
      ).length
      const urgent = jobs.filter(
        job => job.priority === 'ด่วน'
      ).length;

      return {
        pending,
        urgent,
        sla: '98%'
      };
        
    }, [jobs]);

    async function initializeLIFF() {

      try {
        await liff.init({
          liffId: CONFIG.LIFF_ID
        });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const userProfile =
        await liff.getProfile();
        setProfile(userProfile);
        await loadWorkOrders();
      } catch (error) {
        console.error(error);
        alert('ไม่สามารถเชื่อมต่อ Line ได้');
      }
    }

    async function loadWorkOrders() {
      
      try {
        const result =
        await apiservice.getWorkOrders();
        setJobs(result.data || []);
      } catch (error) {
        console.error(error);
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
      updateForm('problem', issue);
    }

    function validateForm() {
      if (!form.room.trim()) {
        alert('กรุณาระบุห้อง');
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
      return true;
    }

    async function submitWorkOrder() {

      try {
        if (!validateForm()) {
          return;
        }

        setLoading(true);

        const payload = {
          action: 'createWorkOrder',
          userId: profile?.userId || '',
          displayName: profile?.displayName || '',
          room: form.room,
          department: form.department,
          phone: form.phone,
          issueType: selectedIssue,
          problem: form.problem,
          remark: form.remark,
          priority: form.priority
        };

        const result = await apiservice.createWorkOrder(payload);

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

        alert('ไม่สามารถแจ้งซ่อมได้');

      }finally{

        setLoading(false);
      }
    }

    function resetForm() {
      setForm(DEFAULT_FORM);
      setSelectedIssue('');

    }

    return (
      <div className='min-h-screen bg-gray-100'>
      
      <HeaderSection 
      profile={profile} 
      kpi={kpi}/>

      <div className='p-4'>
      
      <RepairForm 
      form={form}
      loading={loading}
      selectedIssue={selectedIssue}
      onChange={updateForm}
      onSelectIssue={selectIssue}
      onSubmit={submitWorkOrder}/>

      </div>

      <div className='p-4 pb-24'>
      
      <RecentJobs jobs={jobs} />

      </div>

      <BottomNavigation />

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
      ประเภทปัญหา
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

        <input type='text' value={form.department} onChange={(e) => onChange('department', e.target.value)}
        className='w-full mt-2 border rounded-2xl p-4' placeholder='เช่น Front Office'/>
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
      รายละเอียดปัญหา
      </label>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-600">
          หมายเหตุเพิ่มเติม
        </label>

        <textarea rows={2} value={form.remark} onChange={(e) => onChange('remark', e.target.value)}
        className="w-full mt-2 border rounded-2xl p-4" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"/>
      </div>

      <textarea rows={4} value={form.problem} 
      onChange={(e) => onChange('problem', e.target.value)}
      className='w-full mt-2 border rounded-2xl p-4'
      placeholder='อธิบายปัญหาเพิ่มเติม'/>
      </div>

      <div className='mb-5'>
      
      <label className='text-sm font-medium text-gray-600'>
      ความเร่งด่วน
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
          <JobCard key={index} job={job}/>
          ))
        }
        </div>
        </>
        );
        }

        function JobCard({job}) {
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

        <button className='text-sm bg-green-50 text-green-700 px-3 py-2 rounded-xl'>
        ดูรายละเอียด
        </button>
        </div>
        </div>
        );
        }

        function BottomNavigation() {
        return (

        <div className='fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg'>
        
      <div className='grid grid-cols-4 py-2'>
      
      <NavButton icon='🏠' label='หน้าหลัก' active/>

      <NavButton icon='📋' label='งาน'/>

      <NavButton icon='🛠️' label='PM'/>

      <NavButton icon='👤' label='โปรไฟล์'/>
      </div>
        </div>
        );
        }

        function NavButton({
        icon,
        label,
        active = false
        }) {
        return (
        
        <button className={`flex flex-col items-center 
        ${active ? 'text-green-600' : 'text-gray-400'}`}>
        
        <span className='text-2xl'>
        {icon}
        </span>

        <span className='text-xs'>
        {label}
        </span>
        </button>
        );
        }
