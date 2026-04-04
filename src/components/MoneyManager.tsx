import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Check, Loader2, DollarSign, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Landmark, Calendar, Edit2, BarChart3,
  HandCoins, User, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import UsageLimitBadge from "@/components/UsageLimitBadge";
import UpgradeLimitModal from "@/components/UpgradeLimitModal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Transaction {
  id: string; user_id: string; type: string; amount: number; category: string;
  description: string; transaction_date: string; priority: string; notes: string;
  loan_person_name: string; created_at: string;
}

const EXPENSE_CATS = ["Food", "Transport", "Rent", "Bills", "Shopping", "Health", "Education", "Entertainment", "Subscription", "Equipment", "Other"];
const INCOME_CATS = ["Teaching", "Salary", "Freelance", "Business", "Investment Return", "Gift", "Other"];
const INVEST_CATS = ["Donation", "Stocks", "Crypto", "Real Estate", "Mutual Fund", "Savings", "Business", "Other"];
const LOAN_CATS = ["Personal Loan", "Business Loan", "Family Loan", "Friend Loan", "Bank Loan", "Other"];

const MoneyManager = () => {
  const { user } = useAuth();
  const usageLimits = useUsageLimits("transactions");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  const [loanPersonName, setLoanPersonName] = useState("");

  const [filterType, setFilterType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("lifetime");
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => { if (user) loadTransactions(); }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("transaction_date", { ascending: false });
      if (data) setTransactions(data as unknown as Transaction[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getCats = () => {
    if (type === "income") return INCOME_CATS;
    if (type === "investment") return INVEST_CATS;
    if (type === "loan") return LOAN_CATS;
    return EXPENSE_CATS;
  };

  const openAdd = () => {
    if (!usageLimits.canCreate) { setUpgradeOpen(true); return; }
    setEditTx(null); setType("expense"); setAmount(""); setCategory("Food");
    setDescription(""); setTxDate(new Date().toISOString().split("T")[0]);
    setPriority("medium"); setNotes(""); setLoanPersonName(""); setDialogOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx); setType(tx.type); setAmount(tx.amount.toString()); setCategory(tx.category);
    setDescription(tx.description); setTxDate(tx.transaction_date); setPriority(tx.priority);
    setNotes(tx.notes); setLoanPersonName(tx.loan_person_name || ""); setDialogOpen(true);
  };

  const saveTx = async () => {
    if (!amount || !user) return;
    const txData: any = {
      user_id: user.id, type, amount: parseFloat(amount), category,
      description: description.trim(), transaction_date: txDate,
      priority, notes: notes.trim(), loan_person_name: loanPersonName.trim(),
    };
    try {
      if (editTx) {
        const { error } = await supabase.from("transactions").update(txData).eq("id", editTx.id);
        if (error) throw error;
        setTransactions(transactions.map(t => t.id === editTx.id ? { ...t, ...txData } : t));
        toast.success("Updated!");
      } else {
        const { data, error } = await supabase.from("transactions").insert(txData).select().single();
        if (error) throw error;
        if (data) setTransactions([data as unknown as Transaction, ...transactions]);
        toast.success("Added!");
        usageLimits.refreshCount();
      }
      setDialogOpen(false);
    } catch (e) { toast.error("Failed to save"); console.error(e); }
  };

  const deleteTx = async (id: string) => {
    try {
      await supabase.from("transactions").delete().eq("id", id);
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success("Deleted!");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const stats = useMemo(() => {
    const now = new Date();
    let filtered = transactions;
    if (selectedCalDate) {
      filtered = transactions.filter(t => t.transaction_date === selectedCalDate);
    } else if (filterPeriod === "month") {
      filtered = transactions.filter(t => { const d = new Date(t.transaction_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    } else if (filterPeriod === "year") {
      filtered = transactions.filter(t => new Date(t.transaction_date).getFullYear() === now.getFullYear());
    }
    const income = filtered.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const investment = filtered.filter(t => t.type === "investment").reduce((s, t) => s + Number(t.amount), 0);
    const loan = filtered.filter(t => t.type === "loan").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, investment, loan, balance: income - expense - investment, filtered };
  }, [transactions, filterPeriod, selectedCalDate]);

  // Chart data - monthly breakdown
  const chartData = useMemo(() => {
    const now = new Date();
    const months: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTx = transactions.filter(t => {
        const td = new Date(t.transaction_date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      months.push({
        name: d.toLocaleDateString("en", { month: "short" }),
        income: monthTx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
        expense: monthTx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
      });
    }
    return months;
  }, [transactions]);

  const displayTx = stats.filtered.filter(t => filterType === "all" || t.type === filterType);

  const formatAmount = (n: number) => "৳" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const getTypeIcon = (t: string) => {
    if (t === "income") return <ArrowUpRight className="h-5 w-5 text-green-400" />;
    if (t === "investment") return <Landmark className="h-5 w-5 text-blue-400" />;
    if (t === "loan") return <HandCoins className="h-5 w-5 text-orange-400" />;
    return <ArrowDownRight className="h-5 w-5 text-red-400" />;
  };

  const getTypeBg = (t: string) => {
    if (t === "income") return "bg-green-500/10";
    if (t === "investment") return "bg-blue-500/10";
    if (t === "loan") return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  const getTypeColor = (t: string) => {
    if (t === "income") return "text-green-400";
    if (t === "investment") return "text-blue-400";
    if (t === "loan") return "text-orange-400";
    return "text-red-400";
  };

  // Calendar
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNamesShort = ["S", "M", "T", "W", "T", "F", "S"];

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [calendarMonth]);

  const dayHasTx = (date: Date) => {
    const ds = date.toISOString().split("T")[0];
    return transactions.some(t => t.transaction_date === ds);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" /> Money Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Track income, expenses, investments & loans</p>
          <UsageLimitBadge count={usageLimits.count} limit={usageLimits.limit} isUnlimited={usageLimits.isUnlimited} planName={usageLimits.planName} loading={usageLimits.loading} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowCalendar(!showCalendar); if (showCalendar) setSelectedCalDate(null); }} className="gap-1">
            <Calendar className="h-4 w-4" /> {showCalendar ? "Hide" : "Calendar"}
          </Button>
          <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </div>

      {/* Calendar */}
      {showCalendar && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}><ChevronLeft className="h-5 w-5" /></Button>
              <h3 className="font-bold text-foreground">{monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</h3>
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}><ChevronRight className="h-5 w-5" /></Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {dayNamesShort.map((d, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const ds = day.toISOString().split("T")[0];
                const isSelected = selectedCalDate === ds;
                const isToday = day.toDateString() === new Date().toDateString();
                const hasTx = dayHasTx(day);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedCalDate(isSelected ? null : ds)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all ${
                      isSelected ? "bg-primary text-primary-foreground font-bold" :
                      isToday ? "bg-primary/10 text-primary font-semibold" :
                      "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    {day.getDate()}
                    {hasTx && <div className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
                  </button>
                );
              })}
            </div>
            {selectedCalDate && (
              <div className="mt-3 text-center">
                <Badge variant="outline" className="text-sm">{selectedCalDate}</Badge>
                <Button variant="ghost" size="sm" className="ml-2 text-xs" onClick={() => setSelectedCalDate(null)}>Clear</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Period Filter */}
      {!selectedCalDate && (
        <div className="flex gap-2">
          {["month", "year", "lifetime"].map(p => (
            <Button key={p} variant={filterPeriod === p ? "default" : "outline"} size="sm" onClick={() => setFilterPeriod(p)} className="capitalize">
              {p === "month" ? "This Month" : p === "year" ? "This Year" : "Lifetime"}
            </Button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-green-500/20">
          <CardContent className="pt-5 text-center">
            <ArrowUpRight className="h-7 w-7 text-green-400 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-green-400">{formatAmount(stats.income)}</p>
            <p className="text-xs text-muted-foreground">Income</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="pt-5 text-center">
            <ArrowDownRight className="h-7 w-7 text-red-400 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-red-400">{formatAmount(stats.expense)}</p>
            <p className="text-xs text-muted-foreground">Expense</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="pt-5 text-center">
            <Landmark className="h-7 w-7 text-blue-400 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-blue-400">{formatAmount(stats.investment)}</p>
            <p className="text-xs text-muted-foreground">Investment</p>
          </CardContent>
        </Card>
        {stats.loan > 0 && (
          <Card className="border-orange-500/20">
            <CardContent className="pt-5 text-center">
              <HandCoins className="h-7 w-7 text-orange-400 mx-auto mb-1.5" />
              <p className="text-xl font-bold text-orange-400">{formatAmount(stats.loan)}</p>
              <p className="text-xs text-muted-foreground">Loan</p>
            </CardContent>
          </Card>
        )}
        <Card className={stats.balance >= 0 ? "border-green-500/20" : "border-red-500/20"}>
          <CardContent className="pt-5 text-center">
            <BarChart3 className="h-7 w-7 text-primary mx-auto mb-1.5" />
            <p className={`text-xl font-bold ${stats.balance >= 0 ? "text-green-400" : "text-red-400"}`}>{formatAmount(stats.balance)}</p>
            <p className="text-xs text-muted-foreground">Balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expense Chart */}
      {!selectedCalDate && chartData.some(d => d.income > 0 || d.expense > 0) && (
        <Card>
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Income vs Expense (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Legend />
                <Bar dataKey="income" fill="#4ade80" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "income", "expense", "investment", "loan"].map(t => (
          <Button key={t} variant={filterType === t ? "default" : "outline"} size="sm" onClick={() => setFilterType(t)} className="capitalize">
            {t === "all" ? "All" : t}
          </Button>
        ))}
      </div>

      {/* List */}
      {displayTx.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No transactions found.{selectedCalDate ? " Try selecting a different date." : ""}</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {displayTx.map(tx => (
            <Card key={tx.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-3 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getTypeBg(tx.type)}`}>
                  {getTypeIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{tx.description || tx.category}</span>
                    <Badge variant="secondary" className="text-xs">{tx.category}</Badge>
                    {tx.type === "loan" && tx.loan_person_name && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <User className="h-3 w-3" /> {tx.loan_person_name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{tx.transaction_date}{tx.notes ? ` · ${tx.notes}` : ""}</p>
                </div>
                <p className={`font-bold text-lg shrink-0 ${getTypeColor(tx.type)}`}>
                  {tx.type === "income" ? "+" : "-"}{formatAmount(Number(tx.amount))}
                </p>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tx)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTx(tx.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTx ? "Edit Transaction" : "New Transaction"}</DialogTitle>
            <DialogDescription className="sr-only">Transaction form</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={v => {
                setType(v);
                setCategory(v === "income" ? "Salary" : v === "investment" ? "Stocks" : v === "loan" ? "Personal Loan" : "Food");
                if (v !== "loan") setLoanPersonName("");
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">💰 Income</SelectItem>
                  <SelectItem value="expense">💸 Expense</SelectItem>
                  <SelectItem value="investment">🏦 Investment</SelectItem>
                  <SelectItem value="loan">🤝 Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === "loan" && (
              <div className="space-y-1.5">
                <Label>Borrowed From (Person Name) *</Label>
                <Input placeholder="Who did you borrow from?" value={loanPersonName} onChange={e => setLoanPersonName(e.target.value)} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{getCats().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="What was this for?" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveTx} disabled={!amount || (type === "loan" && !loanPersonName.trim())} className="gap-2">
              <Check className="h-4 w-4" /> {editTx ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoneyManager;
