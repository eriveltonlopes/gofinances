import React, {  useState } from "react";
import { Alert, Keyboard, Modal, TouchableWithoutFeedback } from "react-native";

import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import AsyncStorey from "@react-native-async-storage/async-storage";

import uuid from 'react-native-uuid';

import { useForm } from "react-hook-form";
import { useNavigation, NavigationProp, ParamListBase } from "@react-navigation/native";

import { useAuth } from "../../hooks/auth";
import { InputForm } from "../../components/Forms/InputForm";
import { Button } from "../../components/Forms/Button";
import { CategorySelecButton } from "../../components/Forms/CategorySelectButton";
import { TransactionTypeButton } from "../../components/Forms/TransactionTypeButton";
import { CategorySelect } from "../CategorySelect";

import {
  Container,
  Header,
  Title,
  Form,
  Fields,
  TransactionTypes,
} from "./styles";


const schema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório'),
  amount: Yup
  .number()
  .typeError('Informe um valor númerico')
  .positive('O valor não pode ser negativo')
  .required('O valor é obrigatório')
})

export function Register() {

  const [transactioType, setTransactionType] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const { user } = useAuth();

  const [category, setCategory] = useState({
    key: 'category',
    name: 'Categoria',
  });
  const { navigate }: NavigationProp<ParamListBase> = useNavigation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  function handleTransactionsTypeSelect(type: 'positive' | 'negative') {
    setTransactionType(type);
  };

  function handleOpenSelectCategoryModal() {
    setCategoryModalOpen(true);
  }
  function handleCloseSelectCategoryModal() {
    setCategoryModalOpen(false);
  }

  async function handleRegister(form: any) {

    if (!transactioType) {
      return Alert.alert('Selecione o tipo de transação');
    }
    if (category.key === 'category') {
      return Alert.alert('Selecione a categoria');
    }

    const newTransaction = {
      id:  String(uuid.v4()),
      name: form.name,
      amount: form.amount,
      type: transactioType,
      category: category.key,
      date: new Date()
    }
    try {
      const dataKey = `@gofinances:transactions_user:${user.id}`;
      const data = await AsyncStorey.getItem(dataKey);
      const currentData = data ? JSON.parse(data) : [];

      const dataFormatted = [
        ...currentData,
        newTransaction
      ];

      await AsyncStorey.setItem(dataKey, JSON.stringify(dataFormatted));

      reset();
      setTransactionType('');
      setCategory({
        key: 'category',
        name: 'Categoria'
      });
      navigate('Listagem');

    } catch (error) {
      console.log(error);
      Alert.alert("Não foi possível salvar");
    }
  }
  /*
  useEffect(() => {
    const dataKey = '@gofinances:transactions';
    async function loadData() {
      const data = await AsyncStorey.getItem(dataKey);
      console.log(JSON.parse(data!));
    }
    loadData();

    async function removeAll() {
      await AsyncStorey.removeItem(dataKey);
    }
    removeAll();

  }, []);
   */
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Container>
        <Header>
          <Title>Cadastro</Title>
        </Header>

        <Form>
          <Fields>
            <InputForm
              name="name"
              control={control}
              placeholder="Nome"
              autoCapitalize="sentences"
              autoCorrect={false}
              error={errors.name && errors.name.message}
            />
            <InputForm
              name="amount"
              control={control}
              placeholder="Preço"
              keyboardType="numeric"
              error={errors.amount && errors.amount.message}
            />
            <TransactionTypes>
              <TransactionTypeButton
                type="up"
                title="Income"
                onPress={() => handleTransactionsTypeSelect('positive')}
                isActive={transactioType === 'positive'}
              />
              <TransactionTypeButton
                type="down"
                title="Outcome"
                onPress={() => handleTransactionsTypeSelect('negative')}
                isActive={transactioType === 'negative'}
              />
            </TransactionTypes>
            <CategorySelecButton
              title={category.name}
              onPress={handleOpenSelectCategoryModal}
            />
          </Fields>
          <Button
            title="Enviar"
            onPress={handleSubmit(handleRegister)}
          />
        </Form>

        <Modal visible={categoryModalOpen}>
          <CategorySelect
            category={category}
            setCategory={setCategory}
            closeSelectCategory={handleCloseSelectCategoryModal}
          />
        </Modal>
      </Container>
    </TouchableWithoutFeedback>
  )
}