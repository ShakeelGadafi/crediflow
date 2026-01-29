export default function Badge({ children, variant = 'default', size = 'md', dot = false }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-600/10',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10',
    primary: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10',
    purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/10'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const dotColors = {
    default: 'bg-gray-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    primary: 'bg-indigo-500',
    purple: 'bg-purple-500'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}></span>}
      {children}
    </span>
  );
}
