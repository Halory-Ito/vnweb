import { CheckIcon, SearchIcon } from 'lucide-react'
import Image from 'next/image'
import { useId } from 'react'

import { useCompanyLogoSearch } from '../hooks/use-company-logo-search'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

export default function CompanyLogoSearch({
  title,
  selectedUrl,
  disabled,
  onSelect,
}: {
  title: string
  selectedUrl: string
  disabled?: boolean
  onSelect: (url: string) => void
}) {
  const id = useId()
  const { keyword, setKeyword, submitted, result, search } = useCompanyLogoSearch(title)

  return (
    <div className="min-w-0 space-y-2">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          search()
        }}
      >
        <Field>
          <FieldLabel htmlFor={id}>搜索会社LOGO</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={id}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              maxLength={100}
              placeholder="输入会社名称"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="submit"
                size="sm"
                disabled={!keyword.trim() || result.isFetching}
              >
                <SearchIcon /> 搜索
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </form>
      {result.isFetching ? (
        <p role="status" className="text-muted-foreground text-xs">
          正在搜索…
        </p>
      ) : result.isError ? (
        <p role="status" className="text-muted-foreground text-xs">
          搜索失败，请重试或手动填写图片链接。
        </p>
      ) : result.data?.length ? (
        <ul
          aria-label={`「${submitted}」的 LOGO 搜索结果`}
          className="max-h-44 space-y-1 overflow-y-auto p-0.5"
        >
          {result.data.map(({ id, name, logoUrl }) => (
            <li key={id}>
              <Button
                type="button"
                variant="outline"
                aria-pressed={logoUrl === selectedUrl}
                disabled={disabled}
                className="h-auto w-full min-w-0 justify-start gap-2 px-2 py-1"
                onClick={() => onSelect(logoUrl)}
              >
                <Image
                  unoptimized
                  src={logoUrl}
                  alt=""
                  width={48}
                  height={32}
                  referrerPolicy="no-referrer"
                  className="h-8 w-12 shrink-0 rounded-sm object-contain"
                />
                <span className="min-w-0 flex-1 truncate text-left" title={name}>
                  {name}
                </span>
                {logoUrl === selectedUrl ? <CheckIcon aria-hidden="true" /> : null}
              </Button>
            </li>
          ))}
        </ul>
      ) : submitted ? (
        <p role="status" className="text-muted-foreground text-xs">
          没有找到带 LOGO 的会社。
        </p>
      ) : null}
    </div>
  )
}
