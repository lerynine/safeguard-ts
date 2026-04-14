import React, { useMemo } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { ReportStatus } from "../constants/enums";

const COLORS = ["#3b82f6", "#fbbf24", "#818cf8", "#34d399", "#f43f5e", "#8b5cf6"];

export default function AnalyticsPage({ reports }: { reports: any[] }) {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    // 1. Basic KPIs
    const total = reports.length;
    const closed = reports.filter(r => r.status === ReportStatus.CLOSED).length;
    const inProgress = reports.filter(r => r.status === ReportStatus.IN_PROGRESS).length;
    const open = reports.filter(r => r.status === ReportStatus.OPEN).length;
    const resolutionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // 2. Reports by Status
    const statusData = [
      { name: "Menunggu", value: open, color: "#fbbf24" },
      { name: "Diproses", value: inProgress, color: "#818cf8" },
      { name: "Selesai", value: closed, color: "#34d399" },
    ];

    // 3. Reports by Division
    const divisionMap: Record<string, number> = {};
    reports.forEach(r => {
      const div = r.reportedBy?.division || "Lainnya";
      divisionMap[div] = (divisionMap[div] || 0) + 1;
    });
    const divisionData = Object.entries(divisionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 4. Trend (Last 14 days for more data)
    const last14Days = [...Array(14)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const trendData = last14Days.map(date => {
      return {
        date: new Date(date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }),
        count: reports.filter(r => r.date === date).length
      };
    });

    // 6. Day of Week Distribution
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    // Initialize all days to ensure they appear in the chart even with 0 reports
    const dayMap: Record<string, number> = { 
      "Senin": 0, 
      "Selasa": 0, 
      "Rabu": 0, 
      "Kamis": 0, 
      "Jumat": 0, 
      "Sabtu": 0, 
      "Minggu": 0 
    };
    
    reports.forEach(r => {
      if (r.date) {
        const dateObj = new Date(r.date);
        const dayName = days[dateObj.getDay()];
        dayMap[dayName]++;
      }
    });

    // Order the data to start from Monday to Sunday
    const orderedDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const dayData = orderedDays.map(name => ({ name, value: dayMap[name] }));

    // 7. Finding Type Ratio
    const typeData = [
      { name: "Unsafe Action", value: reports.filter(r => r.findingType === "Unsafe Action").length },
      { name: "Unsafe Condition", value: reports.filter(r => r.findingType === "Unsafe Condition").length },
    ];

    return { 
      total, closed, inProgress, open, resolutionRate,
      statusData, divisionData, typeData, trendData, dayData 
    };
  }, [reports]);

  return (
    <Container>
      <Header className="glass-card">
        <HeaderLeft onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <Title>Rekap Analitik & Metrik</Title>
        </HeaderLeft>
        <HeaderRight>
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </HeaderRight>
      </Header>

      {/* KPI Row */}
      <KPIRow>
        <KPICard as={motion.div} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <KPIIcon color="#3b82f6"><Activity size={20} /></KPIIcon>
          <KPIInfo>
            <span>Total Temuan</span>
            <h3>{stats.total}</h3>
          </KPIInfo>
        </KPICard>
        <KPICard as={motion.div} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <KPIIcon color="#34d399"><CheckCircle2 size={20} /></KPIIcon>
          <KPIInfo>
            <span>Penyelesaian</span>
            <h3>{stats.resolutionRate}%</h3>
          </KPIInfo>
        </KPICard>
        <KPICard as={motion.div} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <KPIIcon color="#fbbf24"><Clock size={20} /></KPIIcon>
          <KPIInfo>
            <span>Menunggu</span>
            <h3>{stats.open}</h3>
          </KPIInfo>
        </KPICard>
        <KPICard as={motion.div} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <KPIIcon color="#818cf8"><AlertCircle size={20} /></KPIIcon>
          <KPIInfo>
            <span>Diproses</span>
            <h3>{stats.inProgress}</h3>
          </KPIInfo>
        </KPICard>
      </KPIRow>

      <SectionTitle>Rasio Tipe Temuan</SectionTitle>
      <TypeGrid style={{ marginBottom: '2rem' }}>
        {stats.typeData.map((type, i) => (
          <TypeCard key={i} as={motion.div} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <TypeIcon color={type.name === "Unsafe Action" ? "#3b82f6" : "#f43f5e"}>
              {type.name === "Unsafe Action" ? <Users size={24} /> : <Filter size={24} />}
            </TypeIcon>
            <TypeInfo>
              <h3>{type.name}</h3>
              <p>{Math.round((type.value / (stats.total || 1)) * 100)}% dari total temuan</p>
            </TypeInfo>
            <TypeValue>{type.value}</TypeValue>
          </TypeCard>
        ))}
      </TypeGrid>

      <BentoGrid>
        {/* Main Trend Chart - Spans 2 columns */}
        <BentoItem className="span-2" as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <CardHeader>
            <TrendingUp size={18} color="#3b82f6" />
            <h3>Tren Laporan (14 Hari Terakhir)</h3>
          </CardHeader>
          <ChartContainer>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  itemStyle={{ color: "#0f172a" }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </BentoItem>

        {/* Status Distribution */}
        <BentoItem as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <CardHeader>
            <PieChartIcon size={18} color="#fbbf24" />
            <h3>Distribusi Status</h3>
          </CardHeader>
          <ChartContainer>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </BentoItem>

        {/* Day of Week Chart */}
        <BentoItem className="span-2" as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <CardHeader>
            <Calendar size={18} color="#f43f5e" />
            <h3>Aktivitas per Hari</h3>
          </CardHeader>
          <ChartContainer>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                <YAxis stroke="#ffffff" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  itemStyle={{ color: "#0f172a" }}
                />
                <Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </BentoItem>
      </BentoGrid>
    </Container>
  );
}

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  color: #e5e7eb;
  background: rgba(52, 59, 92, 0.4);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;
  border-radius: 1rem;
  background: rgba(6, 14, 49, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  color: #f8fafc;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  
  &:hover {
    color: var(--primary);
    transform: translateX(-5px);
  }
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffffff;
  font-size: 0.875rem;
`;

const KPIRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const KPICard = styled.div`
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  }
`;

const KPIIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  background: ${props => props.color}20;
  color: ${props => props.color};
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const KPIInfo = styled.div`
  span {
    font-size: 0.75rem;
    color: #ffffff;
    display: block;
    margin-bottom: 2px;
  }
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
  }
`;

const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: span 2;
    @media (max-width: 768px) {
      grid-column: span 1;
    }
  }
`;

const BentoItem = styled.div`
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 1.5rem;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
  
  h3 {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
`;

const ChartContainer = styled.div`
  flex: 1;
  min-height: 200px;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #ffffff;
`;

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const TypeCard = styled.div`
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
`;

const TypeIcon = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  background: ${props => props.color}20;
  color: ${props => props.color};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TypeInfo = styled.div`
  flex: 1;
  h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 4px;
    color: #ffffff;
  }
  p {
    font-size: 0.75rem;
    color: #ffffff;
  }
`;

const TypeValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
`;
