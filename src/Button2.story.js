import React from 'react'
import { storiesOf } from '@storybook/react'
import Button from 'part:button'

storiesOf('Test button', module)
  .add('with test', () => (
    <Button>Hello test</Button>
  ))
