import React, { useMemo } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  Award,
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

    // 4. Top Reporters
    const reporterMap: Record<string, { name: string, count: number, division: string }> = {};
    reports.forEach(r => {
      const uid = r.reportedBy?.uid;
      if (uid) {
        if (!reporterMap[uid]) {
          reporterMap[uid] = { name: r.reportedBy.name, count: 0, division: r.reportedBy.division };
        }
        reporterMap[uid].count++;
      }
    });
    const topReporters = Object.values(reporterMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Trend (Last 14 days for more data)
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
    const dayMap: Record<string, number> = { "Senin": 0, "Selasa": 0, "Rabu": 0, "Kamis": 0, "Jumat": 0, "Sabtu": 0, "Minggu": 0 };
    reports.forEach(r => {
      if (r.date) {
        const dayName = days[new Date(r.date).getDay()];
        dayMap[dayName]++;
      }
    });
    const dayData = Object.entries(dayMap).map(([name, value]) => ({ name, value }));

    // 7. Finding Type Ratio
    const typeData = [
      { name: "Unsafe Action", value: reports.filter(r => r.findingType === "Unsafe Action").length },
      { name: "Unsafe Condition", value: reports.filter(r => r.findingType === "Unsafe Condition").length },
    ];

    return { 
      total, closed, inProgress, open, resolutionRate,
      statusData, divisionData, topReporters, typeData, trendData, dayData 
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
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
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
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </BentoItem>

        {/* Top Reporters */}
        <BentoItem as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <CardHeader>
            <Award size={18} color="#34d399" />
            <h3>Top Pelapor</h3>
          </CardHeader>
          <ReporterList>
            {stats.topReporters.map((rep, i) => (
              <ReporterItem key={i}>
                <Rank>{i + 1}</Rank>
                <ReporterInfo>
                  <h4>{rep.name}</h4>
                  <span>{rep.division}</span>
                </ReporterInfo>
                <CountBadge>{rep.count}</CountBadge>
              </ReporterItem>
            ))}
            {stats.topReporters.length === 0 && (
              <EmptyText>Belum ada data pelapor</EmptyText>
            )}
          </ReporterList>
        </BentoItem>

        {/* Division Bar Chart */}
        <BentoItem className="span-2" as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <CardHeader>
            <BarChart3 size={18} color="#818cf8" />
            <h3>Laporan per Divisi</h3>
          </CardHeader>
          <ChartContainer>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.divisionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#ffffff" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#ffffff" fontSize={10} width={100} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                />
                <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </BentoItem>

        {/* Day of Week Chart */}
        <BentoItem as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <CardHeader>
            <Calendar size={18} color="#f43f5e" />
            <h3>Aktivitas per Hari</h3>
          </CardHeader>
          <ChartContainer>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                />
                <Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </BentoItem>
      </BentoGrid>

      <SectionTitle>Rasio Tipe Temuan</SectionTitle>
      <TypeGrid>
        {stats.typeData.map((type, i) => (
          <TypeCard key={i} as={motion.div} whileHover={{ y: -5 }}>
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
    </Container>
  );
}

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  border-radius: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #3b82f6;
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
  color: #64748b;
  font-size: 0.875rem;
`;

const KPIRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const KPICard = styled.div`
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
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
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.25rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  
  h3 {
    font-size: 0.9rem;
    font-weight: 600;
    color: #f8fafc;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const ChartContainer = styled.div`
  flex: 1;
  min-height: 200px;
`;

const ReporterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ReporterItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.75rem;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const Rank = styled.div`
  width: 24px;
  height: 24px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
`;

const ReporterInfo = styled.div`
  flex: 1;
  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 2px;
  }
  span {
    font-size: 0.7rem;
    color: #ffffff;
  }
`;

const CountBadge = styled.div`
  padding: 0.25rem 0.6rem;
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
`;

const EmptyText = styled.p`
  text-align: center;
  color: #64748b;
  padding: 2rem;
  font-size: 0.875rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #f8fafc;
`;

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const TypeCard = styled.div`
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.25rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
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
  }
  p {
    font-size: 0.75rem;
    color: #ffffff;
  }
`;

const TypeValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
`;
