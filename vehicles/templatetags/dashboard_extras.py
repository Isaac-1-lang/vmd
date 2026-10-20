from django import template


register = template.Library()


@register.filter
def money(value):
    """12345.6 -> $12,346"""
    if value is None:
        return "-"
    return f"${value:,.0f}"


@register.filter
def compact(value):
    """199971616 -> $199.97M, 4008 -> $4.0k"""
    if value is None:
        return "-"
    size = abs(value)
    if size >= 1_000_000_000:
        return f"${value / 1_000_000_000:.2f}B"
    if size >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    if size >= 1_000:
        return f"${value / 1_000:.1f}k"
    return f"${value:,.0f}"


@register.filter
def num(value, digits=0):
    """9999 -> 9,999"""
    if value is None:
        return "-"
    return f"{value:,.{int(digits)}f}"


@register.filter
def pretty(value):
    """tourism_peak -> Tourism Peak"""
    return str(value).replace("_", " ").title()
